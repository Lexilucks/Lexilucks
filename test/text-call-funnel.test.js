const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const html = readFileSync(join(process.cwd(), "lexi-text-call.html"), "utf8");
const index = readFileSync(join(process.cwd(), "index.html"), "utf8");

test("Text / Call page renders the fan access funnel", () => {
  [
    "Text / Call Lexi Lucks",
    "id=\"packages\"",
    "id=\"request\"",
    "id=\"assistant\"",
    "id=\"setup\"",
    "TEXT_CALL_PRODUCTS"
  ].forEach((token) => assert.ok(html.includes(token), `missing ${token}`));
});

test("pricing cards and request packages render", () => {
  [
    "Join Lexi's Text List",
    "Flirty Fan Drop",
    "Priority Text Request",
    "Real Lexi Text Pass",
    "10-Min Voice Call Request",
    "20-Min Zoom / FaceTime Request",
    "VIP Private Fan Experience",
    "$7.77",
    "$24.99",
    "$499"
  ].forEach((token) => assert.ok(html.includes(token), `missing ${token}`));
});

test("form requires 18 plus, contact consent, terms, and request details", () => {
  [
    "name=\"ageConfirmed\"",
    "data-error-for=\"ageConfirmed\"",
    "name=\"contactConsent\"",
    "data-error-for=\"contactConsent\"",
    "name=\"termsConsent\"",
    "data-error-for=\"termsConsent\"",
    "Enter an email or phone",
    "Please agree to the conduct"
  ].forEach((token) => assert.ok(html.includes(token), `missing ${token}`));
});

test("Stripe links are wired for paid checkout", () => {
  [
    "https://buy.stripe.com/9B67sKfom6Rkh1s8p5bAs05",
    "https://buy.stripe.com/fZudR87VU3F8aD448PbAs06",
    "https://buy.stripe.com/bJe4gyfoma3w12u6gXbAs07",
    "https://buy.stripe.com/aFaeVc0ts3F8bH89t9bAs08",
    "https://buy.stripe.com/9B6cN4ccagrUeTkdJpbAs09",
    "https://buy.stripe.com/fZubJ0b864Jc9z08p5bAs0a",
    "Secure Stripe checkout opens after validation.",
    "Checkout"
  ].forEach((token) => assert.ok(html.includes(token), `missing ${token}`));
});

test("OnlyFans route is present and tracked", () => {
  assert.ok(html.includes("https://www.onlyfans.com/tslollypopz"));
  assert.ok(html.includes("text_call_onlyfans_click"));
  assert.ok(html.includes("For adult-only content and verified platform access, continue on OnlyFans."));
});

test("AI assistant discloses it is not Lexi", () => {
  assert.ok(html.includes("I'm Lexi's AI Assistant, not Lexi."));
  assert.ok(html.includes("I am not Lexi."));
  assert.ok(html.includes("real_lexi_upgrade_click"));
});

test("homepage links to the Text / Call funnel", () => {
  assert.ok(index.includes("lexi-text-call.html"));
  assert.ok(index.includes("Text / Call"));
});
