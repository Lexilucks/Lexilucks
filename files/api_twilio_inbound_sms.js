// api/twilio/inbound-sms.js
// Purpose: Receive inbound SMS → validate 18+ → route keywords → update state → send response
// CRITICAL: STOP handling, compliance, state transitions

import { createClient } from '@supabase/supabase-js';
import { TwilioClient } from 'twilio';
import {
  isOptedOut,
  logConsentEvent,
  handleSTOP,
  handleUNSTOP,
  has18PlusConsent,
  transitionState,
} from '../../src/lib/sms-state-machine.js';
import {
  SMS_TEMPLATES,
  renderSMS,
  getPaymentSuccessSMS,
} from '../../src/lib/sms-copy.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilio = new TwilioClient(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Parse inbound SMS message
 */
function parseMessage(text) {
  return text.trim().toUpperCase();
}

/**
 * Handle age gate confirmation (user replies "YES")
 */
async function handleAgeConfirmation(phoneNumber) {
  // Log consent event
  await logConsentEvent(supabase, phoneNumber, '18+_confirmed', {
    reason: 'user_replied_yes',
  });

  // Ensure contact exists and is opted in
  await supabase
    .from('fan_contacts')
    .upsert(
      {
        phone_number: phoneNumber,
        sms_opted_in: true,
        sms_opted_in_at: new Date().toISOString(),
      },
      { onConflict: 'phone_number' }
    );

  // Send package menu
  return renderSMS('AGE_CONFIRMED');
}

/**
 * Handle package selection (user replies 1-8)
 */
async function handlePackageSelection(phoneNumber, choice) {
  const packages = {
    '1': 'textList',
    '2': 'fanDrop',
    '3': 'priorityText',
    '4': 'realLexiText',
    '5': 'voice10',
    '6': 'video20',
    '7': 'vip',
    '8': 'onlyfans',
  };

  if (!packages[choice]) {
    return renderSMS('INVALID_RESPONSE');
  }

  const packageType = packages[choice];

  // Special case: OnlyFans redirect
  if (packageType === 'onlyfans') {
    return renderSMS('ONLYFANS_REDIRECT');
  }

  // Create fan_request
  const { data: request, error: createError } = await supabase
    .from('fan_requests')
    .insert({
      phone_number: phoneNumber,
      package_type: packageType,
      status: 'package_selected',
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create request:', createError);
    return renderSMS('SYSTEM_ERROR');
  }

  // Get Stripe payment link for this package
  const stripeLinks = {
    textList: process.env.STRIPE_LINK_TEXT_LIST || '[STRIPE_TEXT_LIST]',
    fanDrop: process.env.STRIPE_LINK_FAN_DROP || '[STRIPE_FAN_DROP]',
    priorityText: process.env.STRIPE_LINK_PRIORITY_TEXT || '[STRIPE_PRIORITY_TEXT]',
    realLexiText: process.env.STRIPE_LINK_REAL_LEXI_TEXT || '[STRIPE_REAL_LEXI_TEXT]',
    voice10: process.env.STRIPE_LINK_VOICE_10 || '[STRIPE_VOICE_10]',
    video20: process.env.STRIPE_LINK_VIDEO_20 || '[STRIPE_VIDEO_20]',
    vip: process.env.STRIPE_LINK_VIP || '[STRIPE_VIP]',
  };

  const stripeLink = stripeLinks[packageType];

  // Get appropriate SMS template
  const templateMap = {
    textList: 'PACKAGE_SELECTED_TEXT_LIST',
    fanDrop: 'PACKAGE_SELECTED_FAN_DROP',
    priorityText: 'PACKAGE_SELECTED_PRIORITY_TEXT',
    realLexiText: 'PACKAGE_SELECTED_REAL_LEXI_TEXT',
    voice10: 'PACKAGE_SELECTED_VOICE',
    video20: 'PACKAGE_SELECTED_VIDEO',
    vip: 'PACKAGE_SELECTED_VIP',
  };

  const response = renderSMS(templateMap[packageType], {
    STRIPE_LINK: stripeLink,
  });

  // Transition state
  await transitionState(supabase, request.id, 'checkout_sent');

  return response;
}

/**
 * Route inbound message to appropriate handler
 */
async function routeMessage(phoneNumber, message) {
  const parsed = parseMessage(message);

  // ========================================
  // Special Keywords (highest priority)
  // ========================================

  if (parsed === 'STOP') {
    await handleSTOP(supabase, phoneNumber);
    return renderSMS('STOP_ACKNOWLEDGED');
  }

  if (parsed === 'UNSTOP') {
    await handleUNSTOP(supabase, phoneNumber);
    return renderSMS('UNSTOP_CONFIRMED');
  }

  if (parsed === 'HELP') {
    return renderSMS('HELP');
  }

  // ========================================
  // Compliance Checks
  // ========================================

  // Check if user is opted out
  const optedOut = await isOptedOut(supabase, phoneNumber);
  if (optedOut) {
    return renderSMS('STOP_ACKNOWLEDGED'); // Silently acknowledge (no further messaging)
  }

  // ========================================
  // 18+ Gate & State Machine
  // ========================================

  // Check if user has confirmed 18+
  const hasConsent = await has18PlusConsent(supabase, phoneNumber);

  if (!hasConsent) {
    // User hasn't confirmed age yet
    if (parsed === 'YES') {
      return handleAgeConfirmation(phoneNumber);
    } else {
      return renderSMS('MUST_BE_18');
    }
  }

  // User is 18+, handle package selection (1-8)
  if (/^[1-8]$/.test(parsed)) {
    return handlePackageSelection(phoneNumber, parsed);
  }

  // Invalid input
  return renderSMS('INVALID_RESPONSE');
}

/**
 * Send SMS response (helper)
 */
async function sendSMS(toNumber, message) {
  try {
    const sms = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber,
    });
    console.log(`SMS sent to ${toNumber}: ${sms.sid}`);
    return sms;
  } catch (err) {
    console.error(`Failed to send SMS to ${toNumber}:`, err);
    throw err;
  }
}

/**
 * Main handler (Express.js or Serverless)
 * Twilio sends POST with form data
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse Twilio form data
    const { From: fromNumber, Body: messageBody } = req.body;

    if (!fromNumber || !messageBody) {
      console.error('Missing From or Body in Twilio request');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Inbound SMS from ${fromNumber}: ${messageBody}`);

    // Route message to appropriate handler
    const response = await routeMessage(fromNumber, messageBody);

    // Send response SMS
    await sendSMS(fromNumber, response);

    // Return TwiML to Twilio (empty response)
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${response}</Message>
      </Response>
    `);
  } catch (err) {
    console.error('Inbound SMS handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
