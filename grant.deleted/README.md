# `grant.deleted`

A grant is removed with a Delete Grant request.

**Payload reference:** [grant.deleted](https://developer.nylas.com/docs/reference/notifications/grants/grant-deleted/) · **Sample payload:** [`payload.sample.json`](payload.sample.json)

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="account-disconnected.png"><img src="account-disconnected.png" width="200" alt="account-disconnected preview"></a> | [`account-disconnected.html`](account-disconnected.html) | Confirms the account was disconnected and how to connect it again. |
| <a href="calendar-disconnected.png"><img src="calendar-disconnected.png" width="200" alt="calendar-disconnected preview"></a> | [`calendar-disconnected.html`](calendar-disconnected.html) | For a calendar-powered feature: confirms the calendar connection was removed and what stops working. |

### account-disconnected

Confirms the account was disconnected and how to connect it again.

<img src="account-disconnected.png" width="480" alt="account-disconnected rendered with the sample payload">

### calendar-disconnected

For a calendar-powered feature: confirms the calendar connection was removed and what stops working.

<img src="calendar-disconnected.png" width="480" alt="calendar-disconnected rendered with the sample payload">

## Who receives it

The grant owner. The mailbox may already be gone, so this email can bounce.

## Setup

The workflow **must** set `from`, as for `grant.expired`.

## Payload gotchas

- The payload has only `code` (25013), `grant_id`, `integration_id`, `provider`, and `email`.

## Use a template

Render it against your own payload first. Strict mode fails on any missing variable, and a failed render sends nothing.

```bash
NYLAS_API_KEY=... npm run render -- grant.deleted/account-disconnected
```

Then create the template and a disabled workflow, and enable it when you're happy:

```bash
NYLAS_API_KEY=... node scripts/install.mjs grant.deleted/account-disconnected.html --workflow --from you@yourdomain.com
```

Or follow the [Create template](https://developer.nylas.com/docs/reference/api/application-level-templates/create-app-level-template/) and [Create workflow](https://developer.nylas.com/docs/reference/api/application-level-workflows/create-workflow/) references by hand. Set `"engine": "handlebars"` explicitly, because the API default is Mustache.

## Write a new template for this trigger

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent with a prompt like:

```text
Using the nylas-email-templates skill, write a new grant.deleted template for an offboarding survey email with 3 one-click reasons for leaving.
Start from grant.deleted/account-disconnected.html, use only fields in grant.deleted/payload.sample.json,
and make it pass `npm run render` in every case before you add the screenshot and the README row.
```

## Docs

- [Win back users whose accounts expired](https://developer.nylas.com/docs/cookbook/workflows/reduce-churn-inactive-accounts/)
- [grant.deleted payload reference](https://developer.nylas.com/docs/reference/notifications/grants/grant-deleted/)
- [Templates and workflows](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Why isn't my workflow sending email?](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/)
