/**
 * POST /serverless/functions/send-sms-menu
 * 
 * Trigger the initial SMS menu for the user.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // 1. Check if user already opted in / got menu (placeholder)
    
    // 2. Trigger Twilio send (placeholder)
    console.log(`[Send SMS Menu] Triggered menu send to: ${phone_number}`);

    res.status(200).json({ success: true, queued: true });
  } catch (error) {
    console.error('[Send SMS Menu Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
