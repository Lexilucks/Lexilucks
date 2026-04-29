# Admin Setup

This guide details how to configure the internal admin dashboard to manage Lexi Concierge requests.

## 1. Configure Secret Key

To protect the admin endpoints (`/api/admin/*`) from public access, you must set an admin secret.

1. Generate a secure random string (e.g., using a password manager or `openssl rand -hex 32`).
2. Add it to your `.env.local` file:
   ```
   ADMIN_SECRET_KEY=your_secure_random_string
   ```

## 2. Accessing the Dashboard

In development, access the dashboard at:
`http://localhost:3000/admin/dashboard.html`

In production, access it at:
`https://your-domain.com/admin/dashboard.html`

## 3. Usage

1. **Login**: Enter the `ADMIN_SECRET_KEY` you configured in the environment. It will be stored securely in your browser's `localStorage` to keep you logged in.
2. **View Requests**: The dashboard fetches the latest fan requests, filtered by those requiring attention.
3. **Fulfill**: Click "Mark Complete" to update the database status and optionally trigger a completion SMS to the fan.

*Note: For a fully production-grade system handling sensitive PII long-term, consider moving from API Key auth to an OAuth provider (like Supabase Auth or NextAuth) restricting access to specific admin emails.*
