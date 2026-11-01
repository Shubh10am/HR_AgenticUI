## Summary

- **Security fix (admin APIs):** `/api/admin/organizations` and `/api/admin/organizations/[id]` accepted any bearer string longer than 20 characters, so anyone could list, update or delete organizations. Most other `/api/admin/*` routes accepted any `Admin` role, which includes organization admins, exposing every customer's support tickets, inquiries, posts and analytics across tenants. All 15 admin routes now go through one `requirePlatformAdmin` guard (role `SuperAdmin`/`Admin` **and** no organization).
- **Live admin data:** Dashboard, Analytics and System Health were hard-coded mockups (fake revenue, user counts, 2024 log lines). They now read real metrics with a comparison against the previous period, and the Analytics period selector works.
- **New Logs section (`/admin/logs`):** search, filter and trace user activity across the platform. Includes an event-volume chart, error rate, p50/p95 latency, filter counts, a per-event detail panel, "Trace this user", a live mode and shareable URLs.
- **Settings and Content wired up:** maintenance mode, sender and notification settings, a Slack webhook, subscription plans (create, edit, delete) and editable email templates for all six system emails.
- **Responsive admin layout:** content no longer slides under the fixed sidebar. Inquiry and community tables adapt to tablet and phone, and admins can now read a community post with its comments before moderating it.

## Key Decisions

- **One platform-admin guard (`src/lib/platform-admin.ts`) instead of per-route checks** — the role alone can't separate a platform admin from an organization admin; only `organizationId === null` can. The checks had drifted between routes.
- **Logs read from the existing `AuditLog` collection** — they reuse the audit trail added earlier rather than adding a separate log store. Only changes and sign-ins are recorded, not reads; logging every GET would mean a database write per request (open question for reviewers).
- **Request duration added to audit entries (`durationMs`)** — this powers the p50/p95 latency figures. Older entries have no duration and show "—".
- **Platform settings are a single `global` document, cached for 15 s in memory** — the settings are read on every authenticated request for the maintenance check. A failed read falls back to "not in maintenance", so a settings outage can't lock everyone out.
- **Billing tab removed rather than wired up** — nothing in the app takes payments, and Stripe secret keys belong in environment variables, not a database form.
- **Server secrets shown as "Set" / "Not set" only** — `GOOGLE_API_KEY`, `BREVO_API_KEY` and `ENCRYPTION_KEY` values never reach the browser.
- **Email template defaults are the existing wording, unchanged** — nothing changes for recipients until an admin edits a template. Variables are HTML-escaped and bodies are plain text.
- **Public form input is now escaped in the team notification emails** — contact and demo submissions were inserted into HTML unescaped.
- **Mobile sidebar kept as an icon strip** — this matches the main app's existing behaviour.

## Linked Ticket

Closes: none, no ticket. This work was requested directly while reviewing the admin panel end to end.

## Required Gates

<!-- This repo is a standalone Next.js app (npm), not the Nx monorepo, so the neo-platform Nx commands don't apply. -->

- [ ] Lint passes: `npm run lint`
- [ ] Build passes: `npm run build`
- [x] Typecheck: no new errors in changed files (`tsc` against a config that excludes `src/devDependencies.ts`, which has an existing syntax error that stops `npm run typecheck`). The remaining errors are the existing ~80 `'_id' is of type 'unknown'` warnings.
- [ ] Tests — the repo has no test runner set up
- [x] Manual test steps are documented below
- [x] No hardcoded secrets, tenant IDs, environment URLs, or customer data
- [x] Rollout/rollback notes are included below

## Frontend Gates

- [x] UI built from the existing shadcn/ui components (`@/components/ui`)
- [x] Stable HTML `id`s added for new controls, tables, record rows and dialogs (`admin-logs-*`, `admin-settings-*`, `admin-plan-*`, `admin-template-*`, `admin-post-*`, `admin-kpi-*`)
- [ ] Before/after screenshots attached
- [ ] Mobile screenshots attached for responsive changes
- [x] Loading, empty, error and populated states handled on every new page
- [ ] Screen recording attached for interactive flows

## Generated Artifacts

- [x] N/A, no `.proto` changes
- [x] N/A, no Prisma schema changes. New MongoDB collections are created on first write: `platformsettings`, `emailtemplates`, `subscriptionplans`.

## How To Test

1. `npm run dev`, then sign in at `http://localhost:9002/admin/login` as a platform admin.
2. **Guard:** call `GET /api/admin/organizations` with `Authorization: Bearer aaaaaaaaaaaaaaaaaaaaaaaa` → **401**. With an organization admin's token → **403** on every `/api/admin/*` route. With a platform admin's token → **200**.
3. **Dashboard / Analytics:** the numbers match the database; changing the period updates the KPIs and charts.
4. **Logs:** make a change in the app as an organization user (for example, edit an employee), then open `/admin/logs`. The event appears. Click it → the detail panel opens; **Trace this user** filters to that user and the URL updates.
5. **System Health:** shows a real database response time and key status; "Re-run checks" refreshes.
6. **Settings:** save an invalid sender email → error on the field. Save a valid change → toast, and "Last saved … by …" updates. **Send test message** posts to Slack once a webhook is saved.
7. **Maintenance mode** *(not yet verified — please test)*: switch it on → an organization user sees "Down for maintenance" and gets **503** from the API and at login. A platform admin is unaffected. Switch it off.
8. **Content:** create, edit (mark inactive) and delete a plan. Inactive plans disappear from `GET /api/plans`. Edit a template → "Edited" badge and live preview; **Restore default** reverts it.
9. **Responsive:** at 1440, 1024, 768 and 375px wide, Customer Inquiries and Community Posts have no sideways scroll and the sidebar never covers content. Click a community post → its full text and comments open.

## Check Output

```text
lint:      not run
build:     not run
typecheck: no new errors in changed files (existing _id warnings only)
test:      no test runner set up in this repo
manual:    every admin API checked as platform admin (200), organization admin (403) and fake/no token (401); every admin page loaded in the browser with no runtime errors; no sideways overflow at 1440/1024/800/390px
```

## Risk / Rollback

- **Risk:** organization admins who were (incorrectly) calling `/api/admin/*` now get 403. Maintenance mode, if switched on, blocks every organization user, including at login. Admin settings now control the mailer's sender address, which must be a verified Brevo sender or emails will bounce.
- **Rollout:** deploy as normal. No migration; the settings document is created with today's values on first read. If this Atlas database is shared between environments, settings and templates are shared too.
- **Rollback:** revert the commit. The new collections can stay; the old code ignores them. If maintenance mode was left on, switch it off before reverting, or delete the `platformsettings` document.

## Notes For Reviewers

- `src/lib/withAuth.ts` now runs a maintenance check (cached settings read) on every authenticated request. Platform admins skip it.
- `src/services/admin/log-query.ts` uses Mongo `$dateTrunc` (MongoDB 5.0+; fine on Atlas). Histogram buckets are filled so quiet periods show as empty bars.
- Not addressed here: the employee and platform-admin welcome emails still contain plain-text passwords (existing behaviour; a set-password link would be safer). `src/lib/encryption.ts` is still marked `'use server'`. `src/devDependencies.ts` still breaks `npm run typecheck`.
