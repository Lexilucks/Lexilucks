import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const publicPages = [
  "index.html",
  "shop.html",
  "dashboard.html",
  "lexi-text-call.html",
  "princess-protocol.html",
  "coachella2026.html",
  "coachella2026-itinerary.html",
  "media-kit.html",
  "rate-card.html",
  "celine-medspa-pitch.html",
  "privacy.html",
  "terms.html"
];

const jsFiles = [
  "src/lib/analytics.js",
  "src/lib/lead-capture.js",
  "src/lib/site-enhancements.js",
  "lexi-concierge.js"
];

const requiredEvents = [
  "page_view",
  "hero_cta_click",
  "party_network_form_start",
  "party_network_form_submit",
  "social_click",
  "live_platform_click",
  "patreon_tier_click",
  "merch_click",
  "discord_click",
  "brand_inquiry_click",
  "ai_concierge_open",
  "ai_concierge_message_submit",
  "transcend_cta_click",
  "text_call_page_view",
  "text_call_package_click",
  "text_call_form_start",
  "text_call_form_submit",
  "text_call_stripe_click",
  "text_call_onlyfans_click",
  "text_call_ai_open",
  "text_call_ai_message",
  "real_lexi_upgrade_click"
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function checkFileExists(file) {
  if (!existsSync(join(root, file))) fail(`Missing required file: ${file}`);
}

function isExternalHref(href) {
  return /^(https?:|mailto:|tel:|sms:|javascript:|#|\/#|\/$)/.test(href);
}

function checkLocalLinks(file, html) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
  hrefs.forEach((href) => {
    if (href === "#") fail(`${file}: unresolved href="#"`);
    if (isExternalHref(href)) return;
    const localPath = href.split("#")[0].split("?")[0];
    if (!localPath || localPath.startsWith("/")) return;
    if (!existsSync(join(root, localPath))) fail(`${file}: local link target missing: ${href}`);
  });
}

function checkHtml(file) {
  checkFileExists(file);
  if (!existsSync(join(root, file))) return;
  const html = read(file);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${file}: missing title`);
  if (!/<meta\s+name=["']description["']/i.test(html)) fail(`${file}: missing meta description`);
  if (/var\(–/.test(html)) fail(`${file}: contains broken CSS var dash`);
  if (/Headshot\.jpeg/.test(html)) fail(`${file}: references missing Headshot.jpeg`);
  if (/sk-ant|x-api-key|ANTHROPIC_API_KEY/i.test(html)) fail(`${file}: contains direct AI secret reference`);
  if ((html.match(/<\/html>/gi) || []).length !== 1) fail(`${file}: should contain exactly one closing html tag`);
  checkLocalLinks(file, html);
}

publicPages.forEach(checkHtml);
jsFiles.forEach(checkFileExists);

const index = read("index.html");
["data-lead-form", "emailConsent", "smsOptIn", "source", "medium", "campaign", "referrer", "landing_page"].forEach((token) => {
  if (!index.includes(token)) fail(`index.html: missing lead capture token ${token}`);
});

const analytics = read("src/lib/analytics.js");
requiredEvents.forEach((eventName) => {
  if (!analytics.includes(eventName)) fail(`analytics.js: missing event ${eventName}`);
});

jsFiles.forEach((file) => {
  const result = spawnSync(process.execPath, ["--check", join(root, file)], { encoding: "utf8" });
  if (result.status !== 0) fail(`${file}: JavaScript syntax failed\n${result.stderr || result.stdout}`);
});

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Static lint passed for ${publicPages.length} pages and ${jsFiles.length} scripts.`);
