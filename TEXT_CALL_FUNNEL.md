# Text / Call Lexi Lucks Funnel

`lexi-text-call.html` is the 18+ fan-access funnel for text list signups, paid access requests, real Lexi text/voice/video inquiries, VIP applications, and OnlyFans routing.

## Current Mode

- Works as a static page with localStorage fallback under `lexi.textCall.requests`.
- Does not collect card numbers or account passwords.
- Uses Stripe Payment Link placeholders in `TEXT_CALL_PRODUCTS`.
- Labels the assistant as `Lexi AI Assistant` and discloses that it is AI when asked.
- Routes adult-only interest to `https://www.onlyfans.com/tslollypopz`.

## Stripe Setup

Create Stripe Payment Links for:

- `fanDrop` - $7.77 Flirty Fan Drop
- `priorityText` - $24.99 Priority Text Request
- `realLexiText` - $49 Real Lexi Text Pass
- `voice10` - $99 10-Min Voice Call Request
- `video20` - $199 20-Min Zoom / FaceTime Request
- `vip` - $499 VIP Private Fan Experience

Then paste the links into `TEXT_CALL_PRODUCTS` in `lexi-text-call.html`:

```js
const TEXT_CALL_PRODUCTS = {
  fanDrop: "https://buy.stripe.com/...",
  priorityText: "https://buy.stripe.com/...",
  realLexiText: "https://buy.stripe.com/...",
  voice10: "https://buy.stripe.com/...",
  video20: "https://buy.stripe.com/...",
  vip: "https://buy.stripe.com/..."
};
```

If a link is empty, the page saves a request instead of opening checkout.

## SMS / Voice / Scheduling Setup

- Twilio or another compliant SMS provider: opt-in, STOP handling, message logs, and fan follow-up.
- Calendly or Cal.com: approved scheduling pages for voice and video packages.
- Zoom: meeting links generated after approval, not public on the page.
- Zapier/Make: connect form requests, Stripe purchases, scheduling, and SMS/email.
- Supabase/Airtable/Google Sheets: request queue, fulfillment status, consent records, and notes.

## Compliance Checklist

- 18+ confirmation required before request submission.
- Email/SMS consent required before follow-up.
- Terms/conduct agreement required.
- Real Lexi access is availability-based.
- Payment does not guarantee explicit content.
- Adult-only content is routed to OnlyFans, not hosted on the public site.
- AI assistant must not pretend to be Lexi.

## Analytics Events

- `text_call_page_view`
- `text_call_package_click`
- `text_call_form_start`
- `text_call_form_submit`
- `text_call_stripe_click`
- `text_call_onlyfans_click`
- `text_call_ai_open`
- `text_call_ai_message`
- `real_lexi_upgrade_click`

## Deployment

```bash
npm run lint
npm run test
npm run build
git add .
git commit -m "Add Text Call Lexi fan access funnel"
git push origin main
```
