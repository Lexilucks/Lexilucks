# Lexi Concierge Handoff Guide

Welcome to the Lexi Concierge Fan Engagement System. This project has been fully architected and scaffolded to provide a compliant, automated, and secure text-to-schedule funnel.

## System Architecture

The system is built on four core pillars:
1. **Frontend**: Static HTML (`lexi-text-call.html`) with a strict 18+ age gate and dynamic SMS CTAs.
2. **Twilio SMS Flow**: Inbound/outbound webhook handlers with a state machine for menu and package selection.
3. **Stripe Webhooks**: Listens for successful payments to automate fulfillment (sending scheduling links).
4. **Supabase Database**: PostgreSQL backend with Row-Level Security (RLS) enforcing strict privacy and compliance.

## Environment Variables Checklist

Before deploying, ensure your production environment has the following variables configured (refer to `.env.local.example`):

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `LEXI_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEXI_CONCIERGE_ENDPOINT`
- `ADMIN_SECRET_KEY`
- `CALENDLY_VOICE_10_LINK`
- `CALENDLY_VIDEO_20_LINK`
- `CALENDLY_VIP_LINK`

## Documentation Links

Please review the following documentation files for detailed setup of each integration:

1. [Supabase Setup Guide](./docs/SUPABASE_SETUP.md) (Database & RLS)
2. [Twilio SMS Flow](./docs/SMS_FLOW.md) & [Keywords](./docs/SMS_KEYWORDS.md)
3. [Stripe Webhook Setup](./docs/STRIPE_WEBHOOK_SETUP.md)
4. [Calendly Integration Setup](./docs/CALENDLY_SETUP.md)
5. [Admin Dashboard Setup](./docs/ADMIN_SETUP.md)

## Next Steps for the Deployment Team

1. **Provision Infrastructure**: Create the Supabase project, Stripe account, and Twilio number.
2. **Run Migrations**: Execute the SQL files in `supabase/migrations/` on the new database.
3. **Install Dependencies**: Run `npm install stripe twilio @supabase/supabase-js` (these were stubbed/commented out during scaffolding).
4. **Deploy**: Push the repository to Vercel/Netlify. Ensure the API routes in `/api` and `/serverless/functions` are built correctly.
5. **Connect Webhooks**: Point Twilio and Stripe to your new production URLs.

---
*Built autonomously by Antigravity.*
