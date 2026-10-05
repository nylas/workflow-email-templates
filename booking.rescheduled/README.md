# `booking.rescheduled`

A booking moves to a new time.

**Payload reference:** [booking.rescheduled](https://developer.nylas.com/docs/reference/notifications/scheduler/booking-rescheduled/) · **Sample payload:** [`payload.sample.json`](payload.sample.json)

> All templates here support 9 languages (en, es, fr, de, sv, zh, ja, nl, ko), picked by `booking_info.guest_language`, including the subject line. Keep all 9 when you edit.

## Templates

| Preview | Template | What it's for |
|---|---|---|
| <a href="rescheduled.png"><img src="rescheduled.png" width="200" alt="rescheduled preview"></a> | [`rescheduled.html`](rescheduled.html) | The new time, with the old time for comparison, plus reschedule and cancel buttons. |

### rescheduled

The new time, with the old time for comparison, plus reschedule and cancel buttons.

<img src="rescheduled.png" width="480" alt="rescheduled rendered with the sample payload">

## Who receives it

Everyone in `booking_info.participants`, in one message. Set `notify_individually` to the string `"true"` (declared on the configuration as a `metadata` field) for one message each, which is what fills in `recipient`. Group bookings never set `recipient`.

## Setup

Follow the [Scheduler setup](../README.md#scheduler-setup) in the root README: `disable_emails`, `notify_individually`, and the webhook reminder.

## Payload gotchas

- Adds `old_start_time` and `old_end_time`, so you can show the previous time.
- Drops 4 fields that `booking.created` has: `event_description`, `event_html_link`, `ical_uid`, and `host_confirmation_url`. A template copied from `booking.created` that uses them fails here. See [why payload fields differ between triggers](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/#why-do-payload-fields-differ-between-triggers).
- `guest_timezone` and `location` are often empty strings.

## Use a template

Render it against your own payload first. Strict mode fails on any missing variable, and a failed render sends nothing.

```bash
NYLAS_API_KEY=... npm run render -- booking.rescheduled/rescheduled
```

Then create the template and a disabled workflow, and enable it when you're happy:

```bash
NYLAS_API_KEY=... node scripts/install.mjs booking.rescheduled/rescheduled.html --workflow
```

Or follow the [Create template](https://developer.nylas.com/docs/reference/api/application-level-templates/create-app-level-template/) and [Create workflow](https://developer.nylas.com/docs/reference/api/application-level-workflows/create-workflow/) references by hand. Set `"engine": "handlebars"` explicitly, because the API default is Mustache.

## Write a new template for this trigger

Install the [`nylas-email-templates` skill](https://github.com/nylas/skills/tree/main/skills/nylas-email-templates) (`npx skills add nylas/skills --skill nylas-email-templates`), then ask your agent with a prompt like:

```text
Using the nylas-email-templates skill, write a new booking.rescheduled template for a reschedule notice that apologizes and offers a discount code when the host moved the meeting.
Start from booking.rescheduled/rescheduled.html, use only fields in booking.rescheduled/payload.sample.json,
and make it pass `npm run render` in every case before you add the screenshot and the README row.
```

## Docs

- [Customize Scheduler email for your app](https://developer.nylas.com/docs/cookbook/workflows/scheduler-booking-email/)
- [Why payload fields differ between triggers](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/#why-do-payload-fields-differ-between-triggers)
- [booking.rescheduled payload reference](https://developer.nylas.com/docs/reference/notifications/scheduler/booking-rescheduled/)
- [Templates and workflows](https://developer.nylas.com/docs/v3/email/templates-workflows/)
- [Why isn't my workflow sending email?](https://developer.nylas.com/docs/cookbook/workflows/workflow-not-sending/)
