# Production Deployment Notes

This document captures the minimum production assumptions for this skeleton. Adjust values per project before deployment.

## Environment Files

Never commit real `.env` files. Use `.env.example` as the model and inject real values through your deployment platform, secret manager, or CI/CD variables.

Frontend variables are public because they are shipped to the browser:

- `VITE_APP_NAME`
- `VITE_APP_URL`
- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`
- `VITE_DEFAULT_LANGUAGE`
- `VITE_ENABLE_SEO`
- `VITE_ENABLE_ANALYTICS`

Backend variables are server-side secrets/configuration:

- `MONGO_URI`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`
- `CLIENT_URLS`
- `TRUST_PROXY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
- `DEFAULT_LANGUAGE`

Use long random values for JWT and cookie secrets. Rotate any credential that was ever committed or shared publicly.

## Reverse Proxy

Terminate TLS at a reverse proxy or platform edge and forward traffic to the backend over a private network.

Set `TRUST_PROXY` only when the app is behind a trusted proxy:

- `TRUST_PROXY=1` for one trusted proxy hop.
- `TRUST_PROXY=loopback` for local reverse proxy deployments.
- Leave empty when Express receives traffic directly.

Do not set `TRUST_PROXY=true` blindly on internet-facing deployments.

## Cookies And Auth

The refresh token cookie is configured as:

- `HttpOnly`: browser JavaScript cannot read it.
- `Secure` in production: requires HTTPS.
- `SameSite=Strict`: blocks most cross-site browser sends.
- `Path=/api/v1/auth`: sent only to auth endpoints.

Access tokens are sent as `Authorization: Bearer ...`. State-changing API routes should either require bearer auth or use an explicit CSRF defense.

The refresh/logout auth routes also enforce an Origin/Referer allowlist using `CLIENT_URLS` for browser requests.

## CORS

Set `CLIENT_URLS` to exact frontend origins, comma-separated:

```env
CLIENT_URLS=https://app.example.com,https://admin.example.com
```

Do not use `*` in production with credentialed requests.

## Security Headers

The backend uses Helmet. In production, an explicit CSP is enabled for backend responses. If the frontend is served from a CDN/static host, configure equivalent headers there:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `X-Frame-Options` or CSP `frame-ancestors`

Validate headers with the deployed URL, not only local code.

## Redis

Use Redis for rate limiting, queues, token blacklist, and permission cache.

Production Redis requirements:

- `maxmemory-policy noeviction`
- persistence configured according to business needs
- authentication enabled
- private network access only
- monitoring for memory, evictions, connected clients, and queue latency

If Redis reports an eviction policy like `volatile-lru`, fix it before production.

## MongoDB

Production MongoDB requirements:

- authenticated private network access
- automated backups
- tested restore procedure
- index review before launch
- monitoring for connection count, slow queries, lock pressure, disk, and replication lag

Run migrations or seeders in a controlled deployment step, not manually from a developer machine.

## File Uploads

The backend validates image MIME type and file signature for avatar uploads. Before enabling general file uploads, add:

- a per-route allowed type matrix
- max file counts and size limits
- malware scanning integration
- private storage by default
- signed URLs for protected downloads

Current upload policy matrix:

- `avatar`: JPEG, PNG, or WEBP up to 5MB, with magic-byte signature validation.
- `languageJson`: JSON files up to 256KB.

The upload middleware includes a malware scanning extension point. The built-in EICAR signature rejection keeps the hook testable; replace or extend it with ClamAV, cloud malware scanning, or an internal scanning service before accepting untrusted general files.

## Logging And Monitoring

Monitor at minimum:

- 5xx API errors
- auth failures and account lock events
- queue failures
- email delivery failures
- Redis connection and eviction metrics
- MongoDB errors and slow queries
- Socket.IO connection/auth failures

Never log passwords, raw tokens, cookies, SMTP credentials, Cloudinary secrets, or password reset/verification tokens.

## Required Validation

Before release:

```bash
npm run validate
```

If backend tests use `mongodb-memory-server`, they need permission to bind local ports in restricted environments.
