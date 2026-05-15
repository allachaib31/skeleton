# Professional Full-Stack Skeleton

This repository is a production-oriented starter for secure, scalable, multilingual applications. It contains a TypeScript React frontend and a TypeScript Node.js/Express backend with authentication, RBAC, audit logging, notifications, uploads, Socket.IO, queues, OpenAPI contracts, tests, and i18n.

Use this skeleton as a strong baseline, not as a place for quick hacks. Every new project built from it must preserve the same quality bar.

## Core Standards

- Every user-facing frontend string must use i18n keys. Do not hardcode visible page, form, table, button, toast, empty-state, error, or navigation text.
- Every backend API response message and email subject/body must be translatable. Use backend locale keys and pass the request language through queues when needed.
- Every sensitive or important business action must create an audit log entry with actor, target, action, entity, IP, user agent, before/after where useful, and timestamp.
- Every user-relevant event should create a notification when it affects account security, role/status, uploads, admin actions, workflow state, or important business state.
- Every new module must respect authentication, authorization, validation, rate limiting where appropriate, error handling, logging, and OpenAPI/API contract discipline.
- Every component and service must be reusable, typed, testable, and small enough to maintain.
- Never bypass security middleware, validation schemas, RBAC checks, upload policies, token/session rules, or audit requirements to make a feature work faster.

## Architecture Expectations

Frontend code should keep page components thin. Put reusable UI in shared components, feature logic in feature folders, API calls in API modules, query/mutation logic in hooks, and cross-feature primitives in shared libraries. Keep table text left-aligned by default unless a design explicitly requires another alignment.

Backend code should keep controllers thin. Controllers should parse request context, call services, and return localized responses. Services own business logic, transactions, audit logs, notifications, and cache invalidation. Middleware owns auth, permissions, validation, rate limits, language, security checks, and upload policy enforcement.

## Multilingual Requirements

- Frontend locale model files must stay structurally aligned.
- Admin language upload must validate uploaded JSON against the model language file before accepting it.
- Backend `Accept-Language` must drive localized API messages and email content.
- New email templates must escape dynamic HTML and use translation keys for all visible text.
- RTL/LTR support must be respected through the existing language direction system.

## Security Requirements

New code must be secure by default:

- Validate input with schemas before business logic.
- Enforce RBAC and permission checks on protected routes.
- Avoid mass assignment by explicitly selecting allowed fields.
- Use typed operational errors, not raw thrown strings.
- Sanitize and validate uploads by MIME type, extension where relevant, size, and file signature.
- Escape dynamic HTML in email/templates.
- Do not expose secrets, tokens, passwords, cookies, stack traces, or PII in responses or logs.
- Preserve CSRF/origin protections for cookie-backed flows.
- Preserve secure JWT, refresh-token rotation, session revocation, and token blacklist behavior.
- Keep dependency audits clean before considering a project ready.

## Audit And Notification Rules

Add audit logs for:

- Authentication events: register, login, logout, refresh abuse, password reset, password change.
- Account events: profile update, avatar update, account deletion, status changes.
- Admin events: role changes, user status changes, user deletion, session revocation, upload deletion.
- Security events: failed login lockouts, suspicious access, permission changes.
- Business events in future projects: create/update/delete of important records, ownership changes, approvals, payments, exports, imports.

Add notifications for:

- Account security changes.
- Role/status changes.
- New login or account lock.
- Workflow updates that users need to see.
- Admin actions that affect a user.

## Quality Gate

Before calling the skeleton or a derived project ready, run:

```bash
npm run validate
```

For focused backend work:

```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run build
```

For focused frontend work:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

If tests cannot run because of local infrastructure or sandbox limits, document the exact reason and run the closest possible checks.

## Documentation

- Backend guide: `READMEBackend.md`
- Frontend guide: `FRONTEND_README.md`
- Production checklist: `PRODUCTION_READINESS_PLAN.md`
- Deployment and operations notes: `docs/production.md`
- Agent rules: `AGENTS.md`

