// Renders every template against its sample payload with POST /v3/templates/render,
// the same strict-mode renderer workflows use. Exits non-zero if any render fails.
//
//   NYLAS_API_KEY=... node scripts/render.mjs            # all templates
//   NYLAS_API_KEY=... node scripts/render.mjs booking    # paths containing "booking"
//
// Each template renders in several cases, because strict mode only fails on the
// variables a payload is missing:
//   full         the sample payload as-is
//   sparse       optional fields empty or absent, the way many real payloads arrive
//   no-recipient recipient removed (notify_individually off, or a group booking)
//   lang-<code>  booking.* templates only: guest_language set to each supported language
//   <custom>     any cases in <folder>/<template>.cases.json
// Rendered HTML lands in .rendered/ for the screenshot script.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API = process.env.NYLAS_API_URI ?? "https://api.us.nylas.com";
const KEY = process.env.NYLAS_API_KEY;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".rendered");
const LANGS = ["es", "fr", "de", "sv", "zh", "ja", "nl", "ko"];
const filter = process.argv[2] ?? "";

// What real payloads often look like: optional fields empty or absent. Every template
// must render these too. Sources: the workflow cookbook recipes on developer.nylas.com.
const sparseBooking = (p) => {
  Object.assign(p.booking_info, { location: "", guest_timezone: "", additional_fields: {} });
  delete p.booking_info.event_description;
  delete p.booking_info.cancellation_reason;
  delete p.recipient; // notify_individually off, so no recipient
  return p;
};
const SPARSE = {
  "booking.created": sparseBooking,
  "booking.rescheduled": sparseBooking,
  "booking.cancelled": sparseBooking,
  "booking.pending": sparseBooking,
  "booking.reminder": sparseBooking,
  // All-day event (no timestamp), no video call, no metadata, participants without names.
  "event.created": (p) => {
    p.when = { object: "date", date: "2026-10-14" };
    delete p.conferencing;
    delete p.recipient;
    p.metadata = {};
    p.participants = p.participants.map(({ email, status }) => ({ email, status }));
    return p;
  },
  "grant.created": (p) => {
    delete p.name;
    return p;
  },
  // Only the recording was enabled for this session.
  "notetaker.media": (p) => {
    p.media = { recording: p.media.recording, recording_file_format: "mp4" };
    return p;
  },
  // Send API templates: only the required variables, optional ones empty.
  "send-api/meeting-summary": ({ meetingDate, summary }) => ({ meetingDate, summary }),
  "send-api/company-brief": (p) => ({ ...p, first_name: "", points: [], say_this: "" }),
  "send-api/analysis-complete": (p) => ({ ...p, first_name: "", top_results: [], has_failures: "" }),
  "notetaker.meeting_state": (p) => {
    delete p.meeting_state;
    delete p.meeting_provider;
    return p;
  },
};

if (!KEY) {
  console.error("Set NYLAS_API_KEY to an API key for any Nylas application.");
  process.exit(1);
}

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const merge = (base, over) => {
  for (const [k, v] of Object.entries(over)) {
    if (UNSAFE_KEYS.has(k) || !Object.hasOwn(over, k)) continue; // never write to the prototype chain
    if (v === null) delete base[k];
    else if (typeof v === "object" && !Array.isArray(v) && typeof base[k] === "object" && base[k] !== null) merge(base[k], v);
    else base[k] = v;
  }
  return base;
};

const subjectOf = (source) => source.match(/^\{\{!--[\s\S]*?^\s*subject:\s*(.+)$/m)?.[1]?.trim();

async function render(body, variables) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${API}/v3/templates/render`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ body, engine: "handlebars", strict: true, variables }),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, (Number(res.headers.get("retry-after")) || 2) * 1000));
      continue;
    }
    const json = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, html: json.data?.body ?? json.data ?? "" } : { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: false, error: "rate limited" };
}

async function templatesIn(dir) {
  const files = await readdir(path.join(ROOT, dir));
  return files.filter((f) => f.endsWith(".html")).map((f) => path.join(dir, f));
}

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !["scripts", "node_modules"].includes(d.name))
  .map((d) => d.name);

const jobs = [];
for (const dir of dirs) {
  for (const file of await templatesIn(dir)) {
    if (!file.includes(filter)) continue;
    const name = path.basename(file, ".html");
    const payloadFile = dir === "send-api" ? `${dir}/${name}.variables.json` : `${dir}/payload.sample.json`;
    const payload = JSON.parse(await readFile(path.join(ROOT, payloadFile), "utf8"));
    const cases = [["full", payload]];
    const sparse = SPARSE[dir] ?? SPARSE[`${dir}/${name}`];
    if (sparse) cases.push(["sparse", sparse(structuredClone(payload))]);
    if (dir !== "send-api" && payload.recipient) {
      const { recipient, ...rest } = payload;
      cases.push(["no-recipient", rest]);
    }
    // Optional <name>.cases.json: { "case-name": { ...overrides } }, deep-merged onto the
    // sample payload. Use it to test the custom metadata keys a template reads. A null
    // value removes the key.
    const casesFile = path.join(ROOT, dir, `${name}.cases.json`);
    const extra = await readFile(casesFile, "utf8").then(JSON.parse).catch((e) => (e.code === "ENOENT" ? {} : Promise.reject(e)));
    for (const [label, overrides] of Object.entries(extra)) cases.push([label, merge(structuredClone(payload), overrides)]);
    const source = await readFile(path.join(ROOT, file), "utf8");
    if (dir.startsWith("booking.") && source.includes("guest_language")) {
      for (const lang of LANGS) cases.push([`lang-${lang}`, { ...payload, booking_info: { ...payload.booking_info, guest_language: lang } }]);
    }
    jobs.push({ dir, name, file, source, cases });
  }
}

await mkdir(OUT, { recursive: true });
let failures = 0;
for (const { dir, name, file, source, cases } of jobs) {
  const subject = subjectOf(source);
  const results = [];
  for (const [label, variables] of cases) {
    const [body, subj] = await Promise.all([render(source, variables), subject ? render(subject, variables) : { ok: true, html: "" }]);
    if (!body.ok || !subj.ok) {
      failures++;
      results.push(`✗ ${label}: ${body.ok ? `subject: ${subj.error}` : body.error}`);
      continue;
    }
    results.push(`✓ ${label}`);
    await writeFile(path.join(OUT, `${dir}__${name}__${label}.html`), body.html);
    if (label === "full") await writeFile(path.join(OUT, `${dir}__${name}__subject.txt`), subj.html);
  }
  console.log(`${file}\n  ${results.join("  ")}`);
}
console.log(failures ? `\n${failures} render(s) failed` : `\nAll ${jobs.length} templates rendered in every case.`);
process.exit(failures ? 1 : 0);
