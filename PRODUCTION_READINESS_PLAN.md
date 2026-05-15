# Production Readiness Plan

This project is suitable as a production-oriented starter. The checklist below has been completed and verified on 2026-05-14.

## Current Baseline

- Frontend and backend dependency audits currently report zero moderate-or-higher vulnerabilities.
- The backend `cookies-parser` dependency was removed because it was unused and pulled a vulnerable `tough-cookie` version.
- Frontend Vite/Vitest tooling was updated to a patched line to remove the `esbuild` dev-server advisory.
- Frontend Vite config was updated for Vite 8: function-based chunk splitting and no full `process.env` injection into client code.
- Root, frontend, and backend `.gitignore` files now exclude dependencies, builds, local env files, logs, and runtime storage.
- Backend `.env.example` no longer contains real-looking third-party credentials.
- Backend auth refresh/logout paths now have origin checks for browser CSRF defense-in-depth.
- Backend uploads now verify image file signatures after multer parsing instead of trusting only MIME type.
- Backend uploads now use an explicit upload policy matrix for allowed MIME types, file sizes, and a malware-scan extension point.
- Mail templates now escape dynamic values before rendering HTML email content.
- Duplicate nested frontend scaffold copies under `frontend/src/**/frontend` were removed.
- Root `package.json` validation scripts now run contract generation, frontend/backend checks, builds, tests, and audits from one place.
- Root CI workflow runs `npm run validate` for a repeatable production-readiness gate.
- Production deployment notes were added under `docs/production.md`.
- Backend security middleware tests cover refresh/logout origin checks, image signature validation, upload policy validation, and malware-signature rejection.
- Backend integration and authorization tests cover auth flows, negative auth cases, admin route access, protected upload/notification access, and i18n language upload validation.
- Frontend unit tests cover API endpoint contract drift, locale model parity, and LTR/RTL body direction updates.
- Frontend E2E smoke tests cover register, login, public pages, app profile/dashboard/notifications, admin dashboard, and language template download/upload.
- Backend OpenAPI spec can now be exported with `npm --prefix backend run openapi:export`.
- Frontend API contract types are generated from the backend OpenAPI spec.
- Runtime DOM translation fallback was removed; active route pages and shared UI surfaces now use explicit `t()` calls, and uploaded language files are validated against the English model.

## Phase 1: Repo Hygiene And Audit Baseline

- [x] Run `npm audit --audit-level=moderate` for frontend.
- [x] Run `npm audit --audit-level=moderate` for backend.
- [x] Remove unused vulnerable dependency chain from backend.
- [x] Update vulnerable frontend tooling chain.
- [x] Add `.gitignore` coverage for monorepo, frontend, and backend.
- [x] Remove duplicate nested scaffold copies under `frontend/src/**/frontend`.
- [x] Decide final repository layout: single root Git repository or separate frontend/backend repositories.
- [x] Add root-level scripts for validating both apps consistently.

## Phase 2: Security Hardening

- [x] Review CSRF exposure for cookie-backed refresh/logout flows.
- [x] Make refresh-token failures use typed HTTP errors instead of generic errors.
- [x] Document production cookie policy: `HttpOnly`, `Secure`, `SameSite`, domain, path, and proxy requirements.
- [x] Configure explicit Helmet CSP/security headers for API docs and production responses, or document the edge/CDN header policy.
- [x] Configure `trust proxy` deliberately for production reverse proxy deployments.
- [x] Strengthen upload validation with file signature checks, allowed size/type matrix, and malware-scan extension point.
- [x] Confirm all state-changing routes require bearer auth or an explicit CSRF strategy.
- [x] Review mail templates for unescaped dynamic values before production email use.

## Phase 3: Test Coverage

- [x] Backend integration tests for register, login, refresh, logout, password reset, and account deletion.
- [x] Backend authorization tests for admin, role, permission, upload, notification, and i18n routes.
- [x] Backend unit tests for CSRF origin guard and upload file signature validation.
- [x] Backend negative tests for invalid tokens, banned users, expired refresh tokens, and missing default role.
- [x] Frontend E2E smoke tests for register, login, `/app/dashboard`, `/app/profile`, notifications, and admin dashboard.
- [x] Frontend E2E tests for language template download and language JSON upload.
- [x] Add CI command that runs typecheck, tests, build, and audit for both apps.

## Phase 4: I18n Architecture

- [x] Replace the runtime DOM translation fallback with explicit `t()` usage in active route pages and shared UI components.
- [x] Keep the language-management admin page and JSON model validation.
- [x] Add tests to ensure uploaded language files match the English model keys.
- [x] Confirm `body.dir` updates correctly for LTR and RTL languages.

## Phase 5: API Contract Discipline

- [x] Generate or maintain OpenAPI schemas for auth, users, admin, uploads, notifications, and i18n endpoints.
- [x] Add frontend API response types from the shared contract or generated client.
- [x] Add tests that fail when backend response shapes drift from frontend expectations.

## Phase 6: Production Operations

- [x] Document required environment variables for frontend and backend.
- [x] Document Redis production settings, including `maxmemory-policy noeviction`.
- [x] Document MongoDB backup, migration, index, and restore procedures.
- [x] Document deployment behind a reverse proxy with TLS termination.
- [x] Add monitoring guidance for API errors, auth failures, queue failures, Redis, MongoDB, and Socket.IO.
- [x] Add log redaction rules for secrets, tokens, cookies, passwords, and PII.

## Final Gate

Run this before considering the skeleton ready for client or SaaS production use:

```bash
npm run validate
```

Or run the same checks manually:

```bash
cd frontend
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate

cd ../backend
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

The project can be used now as a production-oriented starter. Before deploying a real product, still configure deployment-specific secrets, domains, backups, monitoring, and infrastructure policy for that environment.

## Latest Validation

Last full validation: 2026-05-14

```bash
npm run validate
```

Result: passed contract generation, typecheck, tests, build, and moderate-or-higher dependency audit for frontend and backend.

```bash
npm --prefix frontend run e2e
```

Result: passed 8 frontend E2E smoke tests for auth, public pages, app pages, admin dashboard, and language management.
