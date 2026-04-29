/**
 * POST /serverless/functions/verify-age
 * 
 * Server-side age gate verification.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone_number, ageConfirmed, ipAddress } = req.body;

    if (!ageConfirmed) {
      return res.status(400).json({ error: 'Age confirmation is strictly required.' });
    }

    // 1. Log consent event to Supabase consent_events table (placeholder)
    console.log(`[Verify Age] Consent logged for phone: ${phone_number || 'anonymous'} from IP: ${ipAddress}`);

    res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error('[Verify Age Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
