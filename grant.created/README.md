# `grant.created`

A user connects an account (a new grant).

**Payload reference:** [grant.created](https://developer.nylas.com/docs/reference/notifications/grants/grant-created/) · **Sample payload:** [`payload.sample.json`](payload.sample.json)

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="welcome.png"><img src="welcome.png" width="200" alt="welcome preview"></a> | [`welcome.html`](welcome.html) | Welcomes the user and confirms which account and permissions they connected. |
| <a href="calendar-connected.png"><img src="calendar-connected.png" width="200" alt="calendar-connected preview"></a> | [`calendar-connected.html`](calendar-connected.html) | For a feature that needs the user's calendar: confirms the connection and what happens next (here, meeting briefings). |

### welcome

Welcomes the user and confirms which account and permissions they connected.

<img src="welcome.png" width="480" alt="welcome rendered with the sample payload">

### calendar-connected

For a feature that needs the user's calendar: confirms the connection and what happens next (here, meeting briefings).

<img src="calendar-connected.png" width="480" alt="calendar-connected rendered with the sample payload">

## Who receives it

The grant owner. There's no `recipient` object, so use `{{email}}` and `{{name}}` from the payload.

## Setup

None. Without `from`, the email sends from the user's own address, which needs send scopes. With identity-only scopes the send fails silently, so set `from` if you aren't sure.

## Payload gotchas

- It's the only grant trigger with `name`, `scope`, and `login_id`. `name` is absent for some providers.
- `scope` is an array of strings.

## Use a template

Render it against your own payload first. Strict mode fails on any missing variable, and a failed render sends nothing.

```bash
NYLAS_API_KEY=... npm run render -- grant.created/welcome
```

Then create the template and a disabled workflow, and enable it when you're happy:

```bash
NYLAS_API_KEY=... node scripts/install.mjs grant.created/welcome.html --workflow
```

Or follow the [Create template](https://developer.nylas.com/docs/reference/api/application-level-templates/create-app-level-template/) and [Create workflow](https://developer.nylas.com/docs/reference/api/application-level-workflows/create-workflow/) references by hand. Set `"engine": "handlebars"` explicitly, because the API default is Mustache.

## Write a new template for this trigger

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent with a prompt like:

```text
Using the nylas-email-templates skill, write a new grant.created template for an onboarding email that suggests a first step based on which scopes the user granted (email, calendar, or both).
Start from grant.created/welcome.html, use only fields in grant.created/payload.sample.json,
and make it pass `npm run render` in every case before you add the screenshot and the README row.
```

## Docs

- [Welcome users when they connect an account](https://developer.nylas.com/docs/cookbook/workflows/welcome-connected-account/)
- [grant.created payload reference](https://developer.nylas.com/docs/reference/notifications/grants/grant-created/)
- [Templates and workflows](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Why isn't my workflow sending email?](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/)
