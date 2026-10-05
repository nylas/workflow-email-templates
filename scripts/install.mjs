// Creates an application-level template from a file in this repo, and optionally the
// workflow that sends it. Saves escaping HTML into a JSON string by hand.
//
//   NYLAS_API_KEY=... node scripts/install.mjs booking.created/confirmation.html
//   NYLAS_API_KEY=... node scripts/install.mjs booking.created/confirmation.html --workflow
//   NYLAS_API_KEY=... node scripts/install.mjs booking.created/confirmation.html --workflow --from bookings@yourdomain.com --from-name "Your Company"
//   node scripts/install.mjs booking.created/confirmation.html --workflow --dry-run   # print the requests only
//
// Without --from, the workflow sends through the host's own grant (no domain setup needed).
// With --from, it sends through transactional send on a domain you've registered.
// Workflows are created disabled unless you pass --enable, so you can render-test first.

import { readFile } from "node:fs/promises";
import path from "node:path";

const API = process.env.NYLAS_API_URI ?? "https://api.us.nylas.com";
const KEY = process.env.NYLAS_API_KEY;
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const file = args.find((a) => a.endsWith(".html"));

if (!file) {
  console.error("Usage: node scripts/install.mjs <trigger>/<template>.html [--workflow] [--from email] [--from-name name] [--enable] [--dry-run]");
  process.exit(1);
}
if (!KEY && !flag("dry-run")) {
  console.error("Set NYLAS_API_KEY, or pass --dry-run.");
  process.exit(1);
}

const source = await readFile(path.resolve(file), "utf8");
const header = source.match(/^\{\{!--([\s\S]*?)--\}\}/)?.[1] ?? "";
const subject = header.match(/^\s*subject:\s*(.+)$/m)?.[1]?.trim();
const trigger = path.basename(path.dirname(path.resolve(file)));
const name = `${trigger}: ${path.basename(file, ".html")}`;
if (!subject) {
  console.error(`${file} has no "subject:" line in its header comment.`);
  process.exit(1);
}

async function post(endpoint, body) {
  if (flag("dry-run")) {
    console.log(`POST ${API}${endpoint}\n${JSON.stringify({ ...body, body: body.body ? `<${body.body.length} characters of HTML>` : undefined }, null, 2)}\n`);
    return { id: endpoint.endsWith("/workflows") ? "<WORKFLOW_ID>" : "<TEMPLATE_ID>" };
  }
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`POST ${endpoint} failed (${res.status}): ${json.error?.message ?? "no error message"}`);
    process.exit(1);
  }
  return json.data;
}

// Check the workflow options before creating anything, so a bad call leaves nothing behind.
if (flag("workflow") && trigger === "send-api") {
  console.error("send-api templates have no trigger. Send them with the template field on a send request instead (see send-api/README.md).");
  process.exit(1);
}
if (flag("workflow") && ["grant.expired", "grant.deleted"].includes(trigger) && !option("from")) {
  console.error(`${trigger} workflows must send through transactional send. Pass --from <address on a domain you've registered>.`);
  process.exit(1);
}

const template = await post("/v3/templates", { name, engine: "handlebars", subject, body: source });
console.log(`Template: ${template.id} (${name})`);

if (flag("workflow")) {
  const from = option("from") ? { from: { email: option("from"), ...(option("from-name") ? { name: option("from-name") } : {}) } } : {};
  const workflow = await post("/v3/workflows", {
    name,
    trigger_event: trigger,
    template_id: template.id,
    delay: 0,
    is_enabled: flag("enable"),
    ...from,
  });
  console.log(`Workflow: ${workflow.id} (${trigger}, ${flag("enable") ? "enabled" : "disabled until you enable it"})`);
}
