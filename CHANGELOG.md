# Changelog

## 6.0.0 — Community Suite feature milestone

- Added opt-in birthday registration by month/day only, private listing/removal, configurable announcement channel and daily 09:00 announcement by the server's configured timezone.
- Added interactive 2–4 option polls with one replaceable vote per member and creator/Admin close controls.
- Added private support tickets with configurable support role/category, one active ticket per member, permission-checked close controls and retained channel history.
- Added per-server FAQ management and private slash-command lookup; no Message Content Intent required.
- Added additive SQLite schema for birthday delivery, polls, ticket configuration/records and FAQ entries; existing guild configuration receives the birthday channel column additively.
- Added Vietnamese-localized slash command roots and policy/regression checks for the new modules.
- Preserved the safety model: no automatic ban/kick/timeout; no Message Content Intent; birthday is opt-in and stores no birth year.
- No claim of Discord deployment, live Gateway testing, Android device testing, music/radio, recurring events or dashboard delivery.

## 0.5.0 — Functional MVP expansion

- Added Vietnamese-localized command labels and grouped commands for event, temporary voice, setup, moderation, verification, status and weather.
- Added configurable welcome/goodbye channels and message templates, event channel and IANA timezone settings.
- Expanded metadata-only audit logging to nickname/role/channel/voice and available ban/unban events; message content remains disabled and unstored.
- Added community event creation/cancellation, 30-day history/future list, RSVP buttons and 24-hour/1-hour/10-minute reminder worker with timezone display.
- Added Open-Meteo weather lookup.
- Added multi-lobby temporary voice room creation, owner/admin controls, hidden/locked room-code access, code attempt limiting, recovery after restart and human-only empty-room cleanup.
- Added SQLite tables and additive migrations for event, RSVP, reminder, lobby and temporary room state.
- Added pnpm lockfile and updated CI/Termux scripts to use frozen dependency installs.
- Added policy tests for localization, safety, event and voice feature invariants.

## 0.4.0 — GitHub-ready CI bootstrap

- Added GitHub Actions CI for Node.js 22 typecheck, tests, build and artifact upload.
- Added Dependabot configuration, issue forms, pull request checklist, security policy and contribution guide.
- Added Android-oriented GitHub connection/setup guide and controlled-autonomy approval gates.
- Preserved the original Vietnamese project specification.

## 0.3.1

- Added Android/Termux setup and backup/start scripts.
- Added deployment status and QA notes.
