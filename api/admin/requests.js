/**
 * GET /api/admin/requests
 * 
 * Fetches fan requests for the admin dashboard.
 */

import { verifyAdminAuth } from '../../src/lib/admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Parse filters from query string (status, package, date)
    const { status, packageType } = req.query;

    // 2. Query Supabase fan_requests table using service role key (placeholder)
    console.log(`[Admin] Fetching requests | status: ${status || 'all'} | package: ${packageType || 'all'}`);
    
    // Mock response
    const mockData = [
      {
        id: 'req_1',
        phone_number: '+15551234567',
        package_type: 'realLexiText',
        status: 'paid',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'req_2',
        phone_number: '+15559876543',
        package_type: 'voice10',
        status: 'scheduled',
        paid_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.status(200).json({ data: mockData });
  } catch (error) {
    console.error('[Admin Requests Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
