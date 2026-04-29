// api/twilio/send-sms.js
// Purpose: Helper to send SMS (used by webhook, admin, etc)
// Validates phone number, checks opt-out, logs sends

import { TwilioClient } from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { isOptedOut } from '../../src/lib/sms-state-machine.js';

const twilio = new TwilioClient(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Validate E.164 phone format (+1234567890)
 */
function validatePhoneNumber(phoneNumber) {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Send SMS with compliance checks
 * @param {string} phoneNumber - Recipient phone (E.164 format)
 * @param {string} message - SMS body (max 160 chars, or 2-3 parts for longer)
 * @param {object} options - { skipOptOutCheck: false, logEvent: true, metadata: {} }
 * @returns {Promise<object>} - Twilio response
 */
export async function sendSMS(
  phoneNumber,
  message,
  options = {}
) {
  const { skipOptOutCheck = false, logEvent = true, metadata = {} } = options;

  // Validate phone format
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error(
      `Invalid phone number format. Expected E.164 (+1234567890), got: ${phoneNumber}`
    );
  }

  // Check opt-out status
  if (!skipOptOutCheck) {
    const optedOut = await isOptedOut(supabase, phoneNumber);
    if (optedOut) {
      throw new Error(
        `User ${phoneNumber} is opted out. Cannot send SMS.`
      );
    }
  }

  // Check message length (SMS best practice: <160 chars for 1 segment)
  if (message.length > 480) {
    console.warn(
      `SMS message is ${message.length} chars (${Math.ceil(
        message.length / 160
      )} segments). Consider breaking into multiple messages.`
    );
  }

  try {
    // Send via Twilio
    const sms = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent to ${phoneNumber}: ${sms.sid}`);

    // Log event (optional)
    if (logEvent) {
      // TODO: Add SMS_LOGS table to Supabase for analytics
      // await supabase.from('sms_logs').insert({
      //   phone_number: phoneNumber,
      //   message_body: message,
      //   twilio_sid: sms.sid,
      //   direction: 'outbound',
      //   status: 'sent',
      //   metadata,
      // });
    }

    return {
      success: true,
      sid: sms.sid,
      status: sms.status,
    };
  } catch (err) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, err);
    throw err;
  }
}

/**
 * Send bulk SMS (admin feature)
 * @param {string[]} phoneNumbers - Array of phone numbers
 * @param {string} message - SMS body
 * @param {object} options - same as sendSMS
 * @returns {Promise<object>} - { succeeded: [], failed: [] }
 */
export async function sendBulkSMS(phoneNumbers, message, options = {}) {
  const results = {
    succeeded: [],
    failed: [],
  };

  for (const phoneNumber of phoneNumbers) {
    try {
      const result = await sendSMS(phoneNumber, message, options);
      results.succeeded.push({ phoneNumber, ...result });
    } catch (err) {
      results.failed.push({
        phoneNumber,
        error: err.message,
      });
    }
  }

  console.log(
    `Bulk SMS: ${results.succeeded.length} sent, ${results.failed.length} failed`
  );
  return results;
}

/**
 * Express handler for manual SMS sending (admin only)
 */
export async function sendSMSHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message, adminToken } = req.body;

    // Verify admin token (TODO: implement proper auth)
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!phoneNumber || !message) {
      return res
        .status(400)
        .json({ error: 'Missing phoneNumber or message' });
    }

    const result = await sendSMS(phoneNumber, message);
    res.status(200).json(result);
  } catch (err) {
    console.error('Send SMS handler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export default sendSMS;
