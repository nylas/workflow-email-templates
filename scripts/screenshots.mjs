// Screenshots each template from the HTML that scripts/render.mjs produced, so the
// images in the READMEs always match the real render. Run `npm run screenshots`.

import { readdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const RENDERED = path.join(ROOT, ".rendered");
// Extra language screenshots, to show the multilingual templates.
const EXTRA = { "booking.created__confirmation": ["lang-es", "lang-ja"] };

const files = (await readdir(RENDERED)).filter((f) => f.endsWith(".html"));
const shots = files.flatMap((f) => {
  const [dir, name, label] = f.replace(/\.html$/, "").split("__");
  if (label === "full") return [{ f, out: path.join(ROOT, dir, `${name}.png`) }];
  const lang = label.replace("lang-", "");
  return (EXTRA[`${dir}__${name}`] ?? []).includes(label) ? [{ f, out: path.join(ROOT, dir, `${name}.${lang}.png`) }] : [];
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
// Images load from file:// here, so a host that sends Cross-Origin-Resource-Policy:
// same-origin (developer.nylas.com does) would show as broken. Mail clients don't load
// images from a file:// page, so relax the header to match what recipients see.
await page.route(/\.(png|jpe?g|gif|svg|webp)(\?|$)/i, async (route) => {
  const response = await route.fetch();
  await route.fulfill({ response, headers: { ...response.headers(), "cross-origin-resource-policy": "cross-origin" } });
});
for (const { f, out } of shots) {
  await page.goto(`file://${path.join(RENDERED, f)}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: out, fullPage: true });
  console.log(path.relative(ROOT, out));
}
await browser.close();
