const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

test("homepage exposes the primary funnel sections", () => {
  ["#hero", "id=\"membership\"", "id=\"work-with-lexi\"", "id=\"stream\"", "id=\"transcend\"", "id=\"party-network\""].forEach((token) => {
    assert.ok(html.includes(token), `missing ${token}`);
  });
});

test("primary CTA and sticky mobile CTA route to Party Network", () => {
  assert.ok(html.includes("Join the Party Network"));
  assert.ok(html.includes("href=\"#party-network\""));
  assert.ok(html.includes("class=\"sticky-cta\""));
});

test("lead form includes validation hooks, consent, and attribution fields", () => {
  ["data-lead-form", "data-error-for=\"name\"", "data-error-for=\"email\"", "data-error-for=\"consent\"", "name=\"emailConsent\"", "name=\"smsOptIn\"", "name=\"source\"", "name=\"medium\"", "name=\"campaign\"", "name=\"referrer\"", "name=\"landing_page\""].forEach((token) => {
    assert.ok(html.includes(token), `missing ${token}`);
  });
});

test("subscription and social CTA events are present", () => {
  ["patreon_tier_click", "live_platform_click", "discord_click", "brand_inquiry_click", "transcend_cta_click", "merch_click"].forEach((eventName) => {
    assert.ok(html.includes(eventName), `missing ${eventName}`);
  });
});
