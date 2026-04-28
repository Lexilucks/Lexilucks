# Testing

## Commands

```bash
npm install
npm run lint
npm run test
npm run build
```

## Coverage

`npm run lint` checks:

- required public pages exist
- titles and meta descriptions exist
- no unresolved `href="#"`
- no broken `var(–...)` CSS
- no missing `Headshot.jpeg` reference
- no obvious browser-side AI secret markers
- local links point to existing files
- analytics event names exist
- JavaScript syntax passes `node --check`

`npm run test` checks:

- analytics attribution and event storage
- lead-form validation and local fallback storage
- homepage smoke coverage for key sections, sticky CTA, lead form hooks, consent, attribution, and CTA event names

## Manual QA Checklist

- Homepage loads on desktop and mobile.
- Primary hero CTA scrolls to Party Network.
- Watch Live CTA scrolls to Stream and Twitch/Kick links open.
- Party Network form shows clear errors when required fields or consent are missing.
- Party Network form shows a success state after valid submission.
- AI Concierge opens, displays demo-mode capability cards, accepts a prompt, and does not claim live guest-list rank.
- Work With Lexi links open media kit, rate card, and email inquiry.
- Transcend links route separately from creator sponsorship links.
- Footer Privacy and Terms links resolve.

## Browser Note

This workspace may not allow binding a local dev server from inside the sandbox. If that happens, open `index.html` directly in the in-app browser or deploy/push to GitHub Pages for full browser QA.
