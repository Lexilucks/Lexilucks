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

global.location = {
  href: "https://lexilucks.com/?utm_source=instagram&utm_medium=social&utm_campaign=coachella",
  search: "?utm_source=instagram&utm_medium=social&utm_campaign=coachella",
  pathname: "/"
};
global.document = {
  title: "Lexi Lucks",
  referrer: "https://instagram.com/",
  addEventListener() {}
};
global.localStorage = createStorage();
global.dataLayer = [];
global.LEXI_ANALYTICS_SILENT = true;

const analytics = require("../src/lib/analytics.js");

test("captures attribution from UTM parameters", () => {
  const attribution = analytics.getAttribution();
  assert.equal(attribution.source, "instagram");
  assert.equal(attribution.medium, "social");
  assert.equal(attribution.campaign, "coachella");
});

test("tracks typed events to local storage and dataLayer", () => {
  const event = analytics.track(analytics.EVENTS.HERO_CTA_CLICK, { label: "Join" });
  assert.equal(event.event, "hero_cta_click");
  assert.equal(event.label, "Join");
  const stored = JSON.parse(global.localStorage.getItem("lexi.analytics.events"));
  assert.equal(stored.at(-1).event, "hero_cta_click");
  assert.equal(global.dataLayer.at(-1).event, "hero_cta_click");
});
