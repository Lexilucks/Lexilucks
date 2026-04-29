/**
 * POST /api/requests/send-scheduling-link
 * 
 * Helper endpoint to manually or automatically send scheduling links
 * to fans who have paid for voice/video/VIP packages.
 */

import { getSchedulingLink } from '../../src/config/calendly-config.js';
import { sendSms } from '../twilio/send-sms.js';
import SMS_TEMPLATES from '../../src/lib/sms-copy-templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, packageType, requestId } = req.body;

    if (!phoneNumber || !packageType) {
      return res.status(400).json({ error: 'Phone number and package type are required.' });
    }

    const link = getSchedulingLink(packageType);

    if (!link) {
      return res.status(400).json({ error: `No scheduling link configured for package: ${packageType}` });
    }

    // Determine the correct message template based on package type
    let messageBody = '';
    if (packageType === 'voice10') {
      messageBody = SMS_TEMPLATES.payment_received_voice(link);
    } else if (packageType === 'video20') {
      messageBody = SMS_TEMPLATES.payment_received_video(link);
    } else if (packageType === 'vip') {
      messageBody = SMS_TEMPLATES.payment_received_vip(link);
    } else {
      return res.status(400).json({ error: `Package ${packageType} does not require scheduling.` });
    }

    // Send the SMS
    const smsResult = await sendSms({
      to: phoneNumber,
      body: messageBody,
      type: 'scheduling_link'
    });

    if (!smsResult.success) {
      throw new Error(smsResult.error || 'Failed to send SMS');
    }

    // In a real implementation:
    // 1. Update fan_requests status to 'scheduling_sent' for requestId
    // 2. Log to fulfillment_notes

    console.log(`[Scheduling Link] Sent ${packageType} link to ${phoneNumber}`);
    res.status(200).json({ success: true, message: 'Scheduling link sent.' });

  } catch (error) {
    console.error('[Scheduling Link Error]', error);
    res.status(500).json({ error: `Failed to send link: ${error.message}` });
  }
}
