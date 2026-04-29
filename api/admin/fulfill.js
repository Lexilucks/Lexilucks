/**
 * POST /api/admin/fulfill
 * 
 * Marks a request as complete and logs notes.
 */

import { verifyAdminAuth } from '../../src/lib/admin-auth.js';
import { sendSms } from '../twilio/send-sms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { requestId, action, note, phoneNumber, notifyUser } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ error: 'requestId and action are required.' });
    }

    // 1. Update fan_requests status in Supabase (placeholder)
    let newStatus = 'completed'; // default
    
    // 2. Create fulfillment_notes entry in Supabase (placeholder)
    console.log(`[Admin Fulfill] Marked ${requestId} as ${action}. Note: ${note}`);

    // 3. Optionally notify user
    if (notifyUser && phoneNumber) {
      await sendSms({
        to: phoneNumber,
        body: `Hi! Lexi's team has updated your request. Note: ${note}`,
        type: 'status_update'
      });
    }

    res.status(200).json({ success: true, newStatus });
  } catch (error) {
    console.error('[Admin Fulfill Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
