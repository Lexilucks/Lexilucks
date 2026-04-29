/**
 * POST /api/requests/create
 * 
 * Create a new fan request from the frontend funnel.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, package: pkg, ageConfirmed, termsConsent } = req.body;

    // 1. Validate request payload
    if (!ageConfirmed || !termsConsent) {
      return res.status(400).json({ error: 'Age confirmation and terms consent are required.' });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required.' });
    }

    // 2. Log request (placeholder for Supabase insertion)
    console.log(`[Request Create] New request from ${name || 'Anonymous'} for package ${pkg}`);

    // 3. Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Request saved successfully.',
      data: { id: 'req_placeholder_123', status: 'new' }
    });
  } catch (error) {
    console.error('[Request Create Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
