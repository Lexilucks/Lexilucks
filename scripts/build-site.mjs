import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "index.html",
  "shop.html",
  "dashboard.html",
  "media-kit.html",
  "rate-card.html",
  "privacy.html",
  "terms.html",
  "robots.txt",
  "sitemap.xml",
  "src/lib/analytics.js",
  "src/lib/lead-capture.js",
  "src/lib/site-enhancements.js",
  "lexi-concierge.js",
  "lexi-concierge.css"
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error(`Missing build files: ${missing.join(", ")}`);
  process.exit(1);
}

const lint = spawnSync(process.execPath, ["scripts/lint-site.mjs"], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit"
});

if (lint.status !== 0) process.exit(lint.status);

console.log("Static build check passed. Deploy the repository root to GitHub Pages.");
