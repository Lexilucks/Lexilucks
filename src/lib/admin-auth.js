/**
 * Lexi Concierge Admin Authentication
 * Very simple API key based authentication for the backend endpoints.
 */

export function verifyAdminAuth(req) {
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  
  if (!adminSecret) {
    // If no secret is configured, fail closed to prevent accidental exposure
    console.warn('[Admin Auth] ADMIN_SECRET_KEY is not configured.');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === adminSecret;
}
