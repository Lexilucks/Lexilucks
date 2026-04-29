// api/stripe/webhook.js
// Purpose: Handle Stripe webhooks → update DB → trigger SMS confirmation
// CRITICAL: Verify webhook signature, idempotent on duplicate events

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { TwilioClient } from 'twilio';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilio = new TwilioClient(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Verify Stripe webhook signature (prevents tampering)
 * @param {string} body - Raw request body (not JSON parsed!)
 * @param {string} signature - stripe-signature header
 * @param {string} secret - STRIPE_WEBHOOK_SECRET from .env
 * @returns {boolean}
 */
function verifyWebhookSignature(body, signature, secret) {
  if (!signature || !secret) {
    throw new Error('Missing signature or webhook secret');
  }

  const [timestamp, hash] = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key === 't') acc[0] = value;
    if (key === 'v1') acc[1] = value;
    return acc;
  }, []);

  if (!timestamp || !hash) {
    throw new Error('Invalid signature format');
  }

  // Check timestamp freshness (reject events >5 min old)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    throw new Error('Signature timestamp outside tolerance window');
  }

  // Compute expected hash
  const signedContent = `${timestamp}.${body}`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  // Constant-time comparison (prevents timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}

/**
 * Handle checkout.session.completed event (customer completed payment)
 */
async function handleCheckoutSessionCompleted(event) {
  const { id: stripe_event_id, data } = event;
  const { object: session } = data;

  const {
    id: stripe_session_id,
    customer_email: email,
    metadata: { phone_number, package_type },
    payment_status,
    amount_total,
  } = session;

  // Step 1: Log payment event (idempotent via UNIQUE stripe_event_id)
  const { error: paymentError } = await supabase
    .from('payment_events')
    .insert({
      phone_number,
      stripe_event_id,
      stripe_session_id,
      package_type,
      amount_cents: amount_total,
      status: payment_status === 'paid' ? 'succeeded' : 'failed',
      raw_stripe_event: event,
    })
    .onConflict('stripe_event_id')
    .ignoreColumns(['id']); // Idempotent: if event already processed, ignore

  if (paymentError) {
    console.error('Failed to log payment event:', paymentError);
    throw paymentError;
  }

  // Step 2: Update fan_request status to 'paid'
  const { error: updateError } = await supabase
    .from('fan_requests')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_session_id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', stripe_session_id);

  if (updateError) {
    console.error('Failed to update fan_request:', updateError);
    throw updateError;
  }

  // Step 3: Ensure contact is in fan_contacts with SMS opt-in
  const { error: contactError } = await supabase
    .from('fan_contacts')
    .upsert(
      {
        phone_number,
        email,
        sms_opted_in: true,
        sms_opted_in_at: new Date().toISOString(),
      },
      { onConflict: 'phone_number' }
    );

  if (contactError) {
    console.error('Failed to upsert contact:', contactError);
    throw contactError;
  }

  // Step 4: Send SMS confirmation with scheduling link (async, non-blocking)
  sendPostPaymentSMS(phone_number, package_type).catch((err) =>
    console.error('SMS send failed (non-blocking):', err)
  );

  return {
    status: 'ok',
    message: `Processed payment for ${package_type}`,
    phone_number,
  };
}

/**
 * Send post-payment SMS with scheduling link
 */
async function sendPostPaymentSMS(phoneNumber, packageType) {
  const schedulingLinks = {
    voice10: process.env.CALENDLY_VOICE_10_LINK,
    video20: process.env.CALENDLY_VIDEO_20_LINK,
    vip: process.env.CALENDLY_VIP_LINK,
    textList: null, // Text doesn't need scheduling
    fanDrop: null,
    priorityText: null,
    realLexiText: null,
  };

  const schedulingLink = schedulingLinks[packageType];
  const baseMessage = `Hi! 💬 You purchased the ${packageType.replace(
    /([A-Z])/g,
    ' $1'
  )} package. Lexi AI Assistant here to help!`;

  const message = schedulingLink
    ? `${baseMessage}\n\nBook your ${packageType.includes('video') ? 'video call' : 'voice call'} here: ${schedulingLink}`
    : `${baseMessage}\n\nYou'll get a response within 24 hours!`;

  try {
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent to ${phoneNumber} for ${packageType}`);
  } catch (err) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, err);
    throw err;
  }
}

/**
 * Main webhook handler (Express.js)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ⚠️ CRITICAL: Use raw body, not parsed JSON
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody || req.body;

    // Verify webhook signature
    verifyWebhookSignature(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    // Parse event
    const event = JSON.parse(rawBody);

    console.log(`Received Stripe event: ${event.type}`);

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded (already handled in checkout.session.completed)');
        break;

      case 'payment_intent.payment_failed':
        // Log failure
        await supabase.from('payment_events').insert({
          phone_number: event.data.object.metadata?.phone_number,
          stripe_event_id: event.id,
          amount_cents: event.data.object.amount,
          status: 'failed',
          raw_stripe_event: event,
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt (Stripe requirement)
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Return 400 to signal error (Stripe will retry)
    res.status(400).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      // CRITICAL: Raw body needed for signature verification
      raw: true,
    },
  },
};
