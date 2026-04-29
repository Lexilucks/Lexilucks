/**
 * GET /api/requests/get
 * 
 * Fetch a user's requests.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user request (placeholder)
    // const token = req.headers.authorization;
    const userId = 'placeholder_user_id';

    // 2. Fetch requests from Supabase (placeholder)
    console.log(`[Request Get] Fetching requests for user: ${userId}`);
    const mockRequests = [
      { id: '1', package_type: 'realLexiText', status: 'paid', created_at: new Date().toISOString() }
    ];

    // 3. Return responses
    res.status(200).json({ data: mockRequests });
  } catch (error) {
    console.error('[Request Get Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
