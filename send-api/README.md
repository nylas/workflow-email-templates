# Send API templates

These templates have no trigger. Your code sends them when something happens in your product, such as a meeting summary being ready or a long job finishing, and passes the variables itself. The same strict-mode renderer applies: every variable a template uses unguarded must be in `variables`, or the send fails.

**Sample variables:** each template has a `<name>.variables.json` next to it.

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="meeting-summary.png"><img src="meeting-summary.png" width="200" alt="meeting-summary preview"></a> | [`meeting-summary.html`](meeting-summary.html) | Meeting notes after a recorded call: summary, action items, attendees, and a link to the recording. Built for Notetaker summaries. |
| <a href="analysis-complete.png"><img src="analysis-complete.png" width="200" alt="analysis-complete preview"></a> | [`analysis-complete.html`](analysis-complete.html) | A batch job finished (analysis, import, report): a headline, the top results with scores, and a note when some items failed. |
| <a href="company-brief.png"><img src="company-brief.png" width="200" alt="company-brief preview"></a> | [`company-brief.html`](company-brief.html) | A report on one company or record: a takeaway, a score, the top points, and a suggested line to say. |

### meeting-summary

Pass `summary` and `actionItems` as HTML. They render with triple braces, so **sanitize anything a model or a user wrote** before you send it.

| Variable | Required | Notes |
|---|---|---|
| `meetingDate` | Yes | A display string, such as `Wednesday, October 14, 2026`. |
| `summary` | Yes | HTML. |
| `meetingTitle` | No | Falls back to "Meeting notes". |
| `attendees` | No | An array of display names. |
| `actionItems` | No | An array of HTML strings. The section is hidden when it's empty. |
| `recordingUrl` | No | Adds a "Watch the recording" button. |
| `notetakerName`, `notetakerId` | No | Shown in the footer. |

<img src="meeting-summary.png" width="480" alt="meeting-summary rendered with the sample variables">

### analysis-complete and company-brief

These come from Acme Insights, a sales-research app that sends one or the other when an analysis finishes: `company-brief` for a single company, `analysis-complete` for a batch. Every value is built in the app's code before sending, so the templates only branch on truthy strings. Pass flags as `"true"` or `""`, and numbers as strings.

**analysis-complete**

| Variable | Required | Notes |
|---|---|---|
| `headline`, `summary` | Yes | For example "Q4 prospect list is ready" and "Acme Insights analyzed 46 of 48 companies." |
| `project_url`, `app_url` | Yes | The button, and the footer link. |
| `module_label_lower` | Yes | The job type in lowercase, for "because you ran a fit analysis". |
| `first_name` | No | `""` gives "Hi,". |
| `top_results` | No | An array of `{ name, domain, score, url }`. The section is hidden when it's empty. |
| `has_failures`, `failed_count`, `failed_noun` | When failures exist | `has_failures` is `"true"` or `""`. `failed_noun` is "company" or "companies". |
| `project_name`, `is_resume` | For the subject | `is_resume: "true"` changes the subject to "Resume complete". |

<img src="analysis-complete.png" width="480" alt="analysis-complete rendered with the sample variables">

**company-brief**

| Variable | Required | Notes |
|---|---|---|
| `company_name`, `company_domain` | Yes | The headline and the website row. |
| `takeaway`, `summary` | Yes | One sentence for the hero, and a short paragraph. Clip both in code (Acme clips to 160 and 320 characters). |
| `score`, `score_label` | Yes | For example `"4"` and "Overall fit". |
| `report_url`, `app_url`, `module_label`, `module_label_lower` | Yes | The button, the footer, and the subject. |
| `points`, `points_label` | No | Up to 3 `{ title, detail }` items under a heading such as "Fit by product". |
| `say_this`, `say_label` | No | A suggested line, under a label such as "Say this". |
| `first_name` | No | `""` gives "Hi,". |

<img src="company-brief.png" width="480" alt="company-brief rendered with the sample variables">

## Send a template

Create the template once (`node scripts/install.mjs send-api/meeting-summary.html` prints its ID), then reference it with the `template` field on a send request. Variables go in `template.variables`, not in `body`:

```bash
curl -X POST "https://api.us.nylas.com/v3/grants/$GRANT_ID/messages/send" \
  -H "Authorization: Bearer $NYLAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "to": [{ "name": "Nyla Hart", "email": "nyla.hart@example.com" }],
  "template": {
    "id": "$TEMPLATE_ID",
    "strict": true,
    "variables": $(cat send-api/meeting-summary.variables.json)
  }
}
EOF
```

- **Sending from your own domain:** use `POST /v3/domains/{domain}/messages/send` ([transactional send](https://developer.nylas.com/docs/v3/getting-started/transactional-send/)) and add a `from` address. The `template` field is the same.
- **Overriding:** a `subject` or `body` in the request overrides the template's.
- **Strict mode:** keep `strict: true`. With `false`, a missing variable renders as an empty string rather than failing, so a broken email can go out without you noticing.

## Write a new Send API template

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent:

```text
Using the nylas-email-templates skill, write a new send-api template for <what happened in your product>.
Start from send-api/analysis-complete.html, define its variables in send-api/<name>.variables.json,
and make it pass `npm run render` before you add the screenshot and the README row.
```

## Docs

- [Send messages using templates](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Send Message reference](https://developer.nylas.com/docs/reference/api/messages/send-message/): the `template` field
- [Transactional send](https://developer.nylas.com/docs/v3/getting-started/transactional-send/)
- [Template reference](https://developer.nylas.com/docs/reference/api/application-level-templates/)
