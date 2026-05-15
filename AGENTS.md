# Agent Instructions

This repository is a professional production-oriented skeleton. Future agents must preserve the architecture, security posture, i18n discipline, auditability, and scalability of the project.

## Non-Negotiable Rules

- Do not hardcode user-facing text in frontend components. Use i18n keys.
- Do not hardcode backend response or email text. Use backend locale keys and `Accept-Language`.
- Do not add protected routes without authentication and authorization checks.
- Do not add state-changing business behavior without audit logging.
- Do not skip notifications when a user needs to know about a security, account, workflow, or admin-triggered event.
- Do not accept unvalidated request bodies, query params, route params, files, or environment variables.
- Do not leak secrets, tokens, cookies, stack traces, passwords, or private user data.
- Do not make one-off components or services when a reusable shared pattern already exists.
- Do not break OpenAPI/API contract compatibility with the frontend.
- Do not disable tests, validation, rate limits, security middleware, CSRF/origin checks, RBAC, or upload controls to make a task pass.

## Frontend Work

- Keep components typed, focused, and reusable.
- Put feature-specific UI under `frontend/src/features`, shared UI under `frontend/src/shared`, and route pages under `frontend/src/pages`.
- Use existing form, validation, table, layout, query, and store patterns before creating new ones.
- All visible text must be translated, including buttons, labels, placeholders, empty states, table headers, errors, toasts, dialogs, drawer items, admin pages, and public pages.
- Preserve RTL/LTR behavior through the existing language direction system.
- Keep table header/body text left-aligned by default unless a deliberate design requires otherwise.
- Use TanStack Query for server state and invalidate using the current query-key pattern.
- Keep route-level lazy loading safe with suspense/error boundaries.

## Backend Work

- Keep controllers thin: request context in, service call, localized response out.
- Put business logic in services.
- Use Zod or existing validation middleware for input validation.
- Use `HttpError`/`AppError` for operational errors and translation keys for messages.
- Use MongoDB transactions for multi-write business operations.
- Add audit logs for important create/update/delete/security/admin/account actions.
- Add notifications for user-visible account, security, workflow, and admin events.
- Keep cache invalidation explicit when changing user, role, permission, session, upload, or notification state.
- Use OpenAPI annotations and regenerate contracts when API shape changes.
- Keep email templates translated, escaped, and safe for dynamic content.

## Security Checklist For New Features

- Authentication required where needed.
- RBAC/permission checked where needed.
- Ownership checked to prevent IDOR.
- Inputs validated and normalized.
- Allowed fields explicitly selected to prevent mass assignment.
- Uploads constrained by policy and scanned/validated where applicable.
- External URLs validated before use to reduce SSRF/open redirect risk.
- Rate limits added for abuse-prone endpoints.
- Sensitive values excluded from logs and responses.
- Audit log written for important actions.
- Notification created when the affected user should know.
- Tests added or updated for positive and negative paths.

## Multilingual Checklist

- Frontend locale keys added to every supported language model.
- Backend locale keys added to every supported backend locale file.
- Emails include localized subject and body.
- Queued jobs include `lang` when the final worker renders user-facing text.
- Uploaded language files remain model-compatible.
- No runtime DOM translation hacks. Use explicit translation calls.

## Definition Of Done

A change is not complete until:

- Typecheck passes for affected app.
- Tests pass or a real environment limitation is documented.
- User-facing text is multilingual.
- API responses and email text are multilingual when touched.
- Audit and notification behavior is handled where relevant.
- Security and authorization paths are covered.
- Code is reusable, typed, and consistent with existing architecture.

