# Lexi Lucks Creator Business Funnel

Static production site for lexilucks.com. The site is built as HTML/CSS/JavaScript and is intended to deploy directly from the repository root on GitHub Pages.

## What This Site Does

- Converts visitors into Party Network leads with email/SMS consent and attribution capture.
- Routes fans to live streams, Discord, memberships, merch, and Patreon/subscription interest.
- Adds an 18+ Text / Call Lexi funnel for paid fan-access requests, compliant OnlyFans routing, and future SMS/voice/video automation.
- Routes brands to media kit, rate card, UGC, beauty, gaming, nightlife, event, LGBTQ+ campaign, and editorial collaboration paths.
- Separates Lexi Lucks creator partnerships from Transcend Foundation/community inquiries.
- Provides a demo-mode AI Concierge with local personalization and future API endpoint support.
- Adds typed analytics events with local/dev fallback and provider hooks.

## Main Pages

- `index.html` - primary business funnel
- `shop.html` - affiliate, merch, and Patreon/shop hub
- `dashboard.html` - demo/admin and fan status preview
- `lexi-text-call.html` - 18+ text list, paid fan access, voice/video request, and OnlyFans routing funnel
- `princess-protocol.html` - creator product funnel
- `media-kit.html` - sponsor media kit
- `rate-card.html` - collaboration pricing/rate card
- `coachella2026.html` and `coachella2026-itinerary.html` - Coachella planning pages
- `privacy.html` and `terms.html` - policy pages for production readiness

## Local Commands

```bash
npm install
npm run lint
npm run test
npm run build
```

The project has no runtime npm dependencies. `.npmrc` points npm cache at `/tmp/npm-cache` so install works in this workspace even when the user-level npm cache is locked.

## Deploy

Deploy the repository root to GitHub Pages. After tests pass:

```bash
git add .
git commit -m "Productize Lexi Lucks creator business funnel"
git push origin main
```

## Integration Docs

- `AUDIT.md` - audit findings and fixes
- `GROWTH_ENGINE.md` - analytics events and funnel architecture
- `ENVIRONMENT.md` - endpoint/provider configuration
- `TESTING.md` - checks and QA workflow
- `TEXT_CALL_FUNNEL.md` - Text / Call Lexi setup, Stripe/Twilio/scheduling notes, and compliance checklist
