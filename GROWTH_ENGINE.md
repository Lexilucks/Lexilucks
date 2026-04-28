# Growth Engine

## Funnel Architecture

1. Hero sends visitors to `#party-network` first and `#stream` second.
2. Party Network form captures name, email, optional phone, Instagram handle, interest, consent, UTM fields, referrer, and landing page.
3. Membership section gives six realistic tiers and routes interest through a preview modal until Stripe/Patreon/Memberful/Fourthwall is connected.
4. Work With Lexi routes sponsors to `media-kit.html`, `rate-card.html`, and email.
5. Transcend Foundation/community work is routed separately from paid creator campaigns.
6. AI Concierge personalizes locally in demo mode and can later call a secure backend endpoint.

## Analytics Events

Implemented in `src/lib/analytics.js`:

- `page_view`
- `hero_cta_click`
- `party_network_form_start`
- `party_network_form_submit`
- `social_click`
- `live_platform_click`
- `patreon_tier_click`
- `merch_click`
- `discord_click`
- `brand_inquiry_click`
- `ai_concierge_open`
- `ai_concierge_message_submit`
- `transcend_cta_click`
- `lead_form_error`

## Provider Connections

The analytics layer automatically calls providers when their global browser SDKs exist:

- GA4: load Google tag, then `gtag("config", "G-...")`.
- Meta Pixel: load Meta Pixel, then `fbq("init", "...")`.
- TikTok Pixel: load TikTok Pixel, then `ttq.load("...")`.
- PostHog: load PostHog, then `posthog.init("...", { api_host: "..." })`.
- Google Tag Manager: initialize `window.dataLayer`; events are pushed as `{ event: name, ...payload }`.

Until providers are installed, events are stored in `localStorage` under `lexi.analytics.events` and logged in the console unless `window.LEXI_ANALYTICS_SILENT = true`.

## Lead Capture Integrations

Current behavior:

- Posts to Formspree endpoint `https://formspree.io/f/xkopkbkr`.
- Stores a local fallback copy in `localStorage` under `lexi.partyNetwork.leads`.

Future provider options:

- Supabase: create `party_network_leads` table and replace endpoint with a serverless insert route.
- Airtable/Google Sheets: send from Zapier/Make webhook to CRM table.
- ConvertKit/Mailchimp/Klaviyo: map email consent to list subscription and tags.
- Twilio/Postscript/Attentive: map SMS opt-in only when phone and SMS consent are present.
- Discord: use an invite/role webhook after membership provider confirms payment.

## AI Concierge API Plan

Set `window.LEXI_CONCIERGE_ENDPOINT` to a secure backend route. The route should:

- Accept message, page, segment, anonymized profile, voice guide, and recent history.
- Keep provider API keys server-side only.
- Return `{ "reply": "..." }`.
- Never invent live rank, payment, or admission status without real backend data.
