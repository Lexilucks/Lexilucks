# Environment And Configuration

This is a static site. Most production configuration is loaded through secure provider snippets or `window.*` values before the shared scripts run.

## Browser Globals

```html
<script>
  window.LEXI_ANALYTICS_SILENT = false;
  window.LEXI_CONCIERGE_ENDPOINT = "";
  window.LEXI_INSIGHTS_ENDPOINT = "";
  window.LEXI_STUDIO_ENDPOINT = "";
</script>
```

## Variables

- `LEXI_ANALYTICS_SILENT`: set to `true` to suppress console analytics logs.
- `LEXI_CONCIERGE_ENDPOINT`: secure backend endpoint for AI Concierge replies.
- `LEXI_INSIGHTS_ENDPOINT`: secure backend endpoint for dashboard guest-list insights.
- `LEXI_STUDIO_ENDPOINT`: secure backend endpoint for creator/content tools.

## Lead Form

The homepage form uses:

- `data-endpoint="https://formspree.io/f/xkopkbkr"`
- hidden attribution fields: `source`, `medium`, `campaign`, `referrer`, `landing_page`
- consent fields: `emailConsent`, `smsOptIn`

To switch providers, replace the `data-endpoint` URL with a Zapier/Make/Supabase/Cloudflare Worker/Vercel route that accepts JSON.

## Payment/Membership

The membership modal is intentionally preview-mode. Connect one of:

- Patreon
- Stripe Checkout
- Memberful
- Fourthwall
- Ko-fi

Keep the tier keys stable for analytics and fulfillment:

- `curiosity`
- `party-network`
- `fan`
- `supporter`
- `vip`
- `inner-circle`

## Security Notes

- Do not place AI provider keys, CRM keys, webhook secrets, payment secrets, or Discord bot tokens in browser HTML/JS.
- Use serverless functions or a backend proxy for all privileged API calls.
- Rotate any key that was previously exposed in browser code.
