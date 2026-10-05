# `grant.expired`

A grant's credentials stop working, for example after a password change or revoked access.

**Payload reference:** [grant.expired](https://developer.nylas.com/docs/reference/notifications/grants/grant-expired/) · **Sample payload:** [`payload.sample.json`](payload.sample.json)

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="reconnect.png"><img src="reconnect.png" width="200" alt="reconnect preview"></a> | [`reconnect.html`](reconnect.html) | Asks the user to reconnect, naming the account and provider, with a reference ID for support. |
| <a href="reconnect-multi-product.png"><img src="reconnect-multi-product.png" width="200" alt="reconnect-multi-product preview"></a> | [`reconnect-multi-product.html`](reconnect-multi-product.html) | The same idea for one application that serves two products, branded per product by `workspace_id`. |
| <a href="calendar-reconnect.png"><img src="calendar-reconnect.png" width="200" alt="calendar-reconnect preview"></a> | [`calendar-reconnect.html`](calendar-reconnect.html) | For a calendar-powered feature: says what has paused until the user reconnects. |

### reconnect

Asks the user to reconnect, naming the account and provider, with a reference ID for support.

<img src="reconnect.png" width="480" alt="reconnect rendered with the sample payload">

### reconnect-multi-product

The same idea for one application that serves two products, branded per product by `workspace_id`.

<img src="reconnect-multi-product.png" width="480" alt="reconnect-multi-product rendered with the sample payload">

### calendar-reconnect

For a calendar-powered feature: says what has paused until the user reconnects.

<img src="calendar-reconnect.png" width="480" alt="calendar-reconnect rendered with the sample payload">

## Who receives it

The grant owner. There's no `recipient` object and no participants.

## Setup

The workflow **must** set `from`. Without it, creating the workflow returns `400 This event type requires transactional send...`. `scripts/install.mjs` enforces this.

## Payload gotchas

- There's no expiry time. `grant_updated_at` is the last successful update and can be days earlier, so don't show it as "expired at".
- `code` is 25009. There's no `name` or `scope`.
- `reconnect-multi-product` branches on `workspace_id`. That field is still rolling out to grant notifications and isn't in the public payload reference yet. When it's missing, the template shows the second product, so it never fails.

## Use a template

Render it against your own payload first. Strict mode fails on any missing variable, and a failed render sends nothing.

```bash
NYLAS_API_KEY=... npm run render -- grant.expired/reconnect
```

Then create the template and a disabled workflow, and enable it when you're happy:

```bash
NYLAS_API_KEY=... node scripts/install.mjs grant.expired/reconnect.html --workflow --from you@yourdomain.com
```

Or follow the [Create template](https://developer.nylas.com/docs/reference/api/application-level-templates/create-app-level-template/) and [Create workflow](https://developer.nylas.com/docs/reference/api/application-level-workflows/create-workflow/) references by hand. Set `"engine": "handlebars"` explicitly, because the API default is Mustache.

## Write a new template for this trigger

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent with a prompt like:

```text
Using the nylas-email-templates skill, write a new grant.expired template for a second, gentler reconnect nudge sent 3 days later (`delay: 4320`).
Start from grant.expired/reconnect.html, use only fields in grant.expired/payload.sample.json,
and make it pass `npm run render` in every case before you add the screenshot and the README row.
```

## Docs

- [Win back users whose accounts expired](https://developer.nylas.com/docs/cookbook/workflows/reduce-churn-inactive-accounts/)
- [grant.expired payload reference](https://developer.nylas.com/docs/reference/notifications/grants/grant-expired/)
- [Templates and workflows](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Why isn't my workflow sending email?](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/)
