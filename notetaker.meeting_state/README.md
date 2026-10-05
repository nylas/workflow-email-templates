# `notetaker.meeting_state`

Every time a Notetaker bot's meeting state changes, so one email per transition unless the template filters.

**Payload reference:** [notetaker.meeting_state](https://developer.nylas.com/docs/reference/notifications/notetaker/notetaker-meeting_state/) · **Sample payload:** [`payload.sample.json`](payload.sample.json)

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="join-failed.png"><img src="join-failed.png" width="200" alt="join-failed preview"></a> | [`join-failed.html`](join-failed.html) | Explains why the bot couldn't join (denied entry, sign-in required, bad link, and more) and what to do about it. |

### join-failed

Explains why the bot couldn't join (denied entry, sign-in required, bad link, and more) and what to do about it.

<img src="join-failed.png" width="480" alt="join-failed rendered with the sample payload">

## Who receives it

There's no participant list. Send yourself a test to confirm who receives it.

## Setup

None, but most states aren't worth an email. Branch on `status` and `meeting_state` and only say something useful for the states you care about.

## Payload gotchas

- `status` has 4 values and `meeting_state` has 20, and `meeting_state` can be missing.
- Guard `meeting_provider`.
- `join_time` is in milliseconds, unlike most timestamps.

## Use a template

Render it against your own payload first. Strict mode fails on any missing variable, and a failed render sends nothing.

```bash
NYLAS_API_KEY=... npm run render -- notetaker.meeting_state/join-failed
```

Then create the template and a disabled workflow, and enable it when you're happy:

```bash
NYLAS_API_KEY=... node scripts/install.mjs notetaker.meeting_state/join-failed.html --workflow
```

Or follow the [Create template](https://developer.nylas.com/docs/reference/api/application-level-templates/create-app-level-template/) and [Create workflow](https://developer.nylas.com/docs/reference/api/application-level-workflows/create-workflow/) references by hand. Set `"engine": "handlebars"` explicitly, because the API default is Mustache.

## Write a new template for this trigger

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent with a prompt like:

```text
Using the nylas-email-templates skill, write a new notetaker.meeting_state template for a "recording stopped early" email for the `disconnected` status.
Start from notetaker.meeting_state/join-failed.html, use only fields in notetaker.meeting_state/payload.sample.json,
and make it pass `npm run render` in every case before you add the screenshot and the README row.
```

## Docs

- [Email users when Notetaker fails to join](https://developer.nylas.com/docs/cookbook/workflows/notetaker-failed-to-join/)
- [notetaker.meeting_state payload reference](https://developer.nylas.com/docs/reference/notifications/notetaker/notetaker-meeting_state/)
- [Templates and workflows](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Why isn't my workflow sending email?](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/)
