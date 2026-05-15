# Repository Layout

This skeleton uses a single root repository for the frontend and backend.

## Decision

Use one root Git repository with these top-level packages:

- `frontend`: Vite React application.
- `backend`: Express TypeScript API.
- `docs`: production, architecture, and operations notes.
- `package.json`: root orchestration scripts for validation and CI.

## Rationale

- The frontend and backend are designed to evolve together.
- Root validation can check both apps with one command.
- API contract artifacts such as `backend/openapi.json` can be generated and tested against frontend endpoint definitions.
- Shared project documentation stays in one place.

## Rules

- Do not commit `node_modules`, `dist`, local `.env` files, logs, or runtime storage.
- Keep generated contract artifacts reproducible with scripts.
- Put project-wide automation at the root.
- Keep app-specific build and test logic inside each app package.
