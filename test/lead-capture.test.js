const assert = require("node:assert/strict");
const test = require("node:test");

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

global.location = { href: "https://lexilucks.com/", search: "", pathname: "/" };
global.document = { referrer: "" };
global.localStorage = createStorage();

const leadCapture = require("../src/lib/lead-capture.js");

test("validates required lead fields and consent", () => {
  const result = leadCapture.validateLead({ name: "", email: "bad", emailConsent: false, smsOptIn: false });
  assert.equal(result.ok, false);
  assert.equal(result.errors.name, "Please enter your name.");
  assert.equal(result.errors.email, "Please enter a valid email.");
  assert.equal(result.errors.consent, "Choose at least one way Lexi's team can contact you.");
});

test("accepts email-only consent and normalizes phone values", () => {
  const result = leadCapture.validateLead({
    name: "Lexi Fan",
    email: "fan@example.com",
    emailConsent: true,
    smsOptIn: false
  });
  assert.equal(result.ok, true);
  assert.equal(leadCapture.normalizePhone("(562) 754-2937"), "5627542937");
});

test("stores local lead fallback without remote endpoint", async () => {
  const lead = {
    name: "Lexi Fan",
    email: "fan@example.com",
    phone: "",
    instagram: "@fan",
    interest: "party-network",
    emailConsent: true,
    smsOptIn: false,
    attribution: { source: "direct", medium: "", campaign: "", referrer: "", landing_page: "https://lexilucks.com/" }
  };
  const result = await leadCapture.submitLead(lead, "");
  assert.equal(result.mode, "local");
  const stored = JSON.parse(global.localStorage.getItem(leadCapture.STORAGE_KEY));
  assert.equal(stored[0].email, "fan@example.com");
});
