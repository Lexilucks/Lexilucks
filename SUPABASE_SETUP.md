# Supabase Setup Guide

This guide details how to set up the database schema and Row-Level Security (RLS) policies for the Lexi Concierge platform using Supabase.

## 1. Initial Setup

1. Create a new project in your [Supabase Dashboard](https://app.supabase.com).
2. Once the database is provisioned, go to **Project Settings -> API** to retrieve your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Add these credentials to your `.env.local` file (based on `.env.local.example`).

## 2. Running Migrations

The database schema is defined in the `supabase/migrations/` directory.

### Option A: Using Supabase CLI (Recommended)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push the migrations to your remote database:
   ```bash
   supabase db push
   ```

### Option B: Manual Execution via SQL Editor

If you prefer not to use the CLI, you can manually run the SQL scripts in the Supabase Dashboard. 

Go to the **SQL Editor** in your Supabase dashboard and run the files in exact numeric order:
1. `001_create_fan_requests.sql`
2. `002_create_fan_contacts.sql`
3. `003_create_consent_events.sql`
4. `004_create_message_events.sql`
5. `005_create_payment_events.sql`
6. `006_create_fulfillment_notes.sql`

## 3. Row-Level Security (RLS) Explained

For compliance and privacy, Row-Level Security is enabled on all tables:

- **Service Role Key:** Used strictly on the backend (`src/api/` and `serverless/functions/`) to bypass RLS and perform system-level operations (creating users, logging webhooks).
- **Anon Key / Auth Token:** The frontend and authenticated users can only access data explicitly permitted by RLS policies.
- **Fan Contacts & Consent:** Users can only view their own contact and consent records where the phone number matches their verified auth token.

## 4. Maintenance and Monitoring

- **Backups:** Supabase automatically backs up your database daily. You can configure Point-in-Time Recovery (PITR) in the database settings if required.
- **Dashboard Logs:** Monitor `message_events` and `payment_events` tables directly in the Supabase Table Editor to debug Twilio and Stripe webhook deliveries.
