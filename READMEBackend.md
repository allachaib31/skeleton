# Advanced Node.js + Express.js + MongoDB Skeleton

## Enterprise Production-Ready Backend Architecture

Production-ready backend skeleton using:

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Redis
- Socket.IO
- JWT Authentication
- RBAC Permissions
- MongoDB Transactions
- Cloudinary
- Multi-language i18n
- Mail System
- Background Jobs
- Advanced Security
- Scalable Architecture

---

# 1. Project Goal

Build a secure, scalable, modular backend skeleton ready for:

- SaaS platforms
- Marketplaces
- Mobile applications
- E-commerce
- Enterprise dashboards
- Public APIs
- Realtime applications

This architecture must support:

- High scalability
- Advanced security
- Real-time communication
- Clean modular structure
- Production deployment
- Audit logging
- Admin management
- Transactions
- Multi-language APIs

---

# 2. Tech Stack

## Core Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Redis
- Socket.IO

## Authentication

- JWT Access Token
- JWT Refresh Token
- HTTP-only cookies
- Session management
- Token blacklist

## Validation

- Zod

## Upload

- Cloudinary

## Queue

- BullMQ

## Mail

- Nodemailer / SMTP

## Documentation

- Swagger / OpenAPI

## Testing

- Jest
- Supertest

---

# 3. Recommended Project Structure

```txt
src/
  app.ts
  server.ts

  config/
    env.config.ts
    database.config.ts
    redis.config.ts
    cloudinary.config.ts
    mail.config.ts
    socket.config.ts
    i18n.config.ts
    security.config.ts

  modules/
    auth/
    users/
    admin/
    roles/
    permissions/
    uploads/
    notifications/
    mail/
    audit/

  middlewares/
    auth.middleware.ts
    role.middleware.ts
    permission.middleware.ts
    validate.middleware.ts
    error.middleware.ts
    rateLimit.middleware.ts
    language.middleware.ts
    upload.middleware.ts
    transaction.middleware.ts

  common/
    constants/
    helpers/
    utils/
    types/
    responses/
    errors/

  database/
    transaction.ts
    seeders/

  sockets/
    socket.server.ts
    socket.auth.ts
    socket.events.ts

  queues/
    email.queue.ts
    cleanup.queue.ts

  locales/
    en.json
    fr.json
    ar.json

  tests/
```

---

# 4. Installation

```bash
git clone <your-repository>
cd project-name
npm install
cp .env.example .env
npm run dev
```

---

# 5. Environment Variables

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

MONGO_URI=mongodb://localhost:27017/app_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

COOKIE_SECRET=change_me

CLIENT_URLS=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@example.com

DEFAULT_LANGUAGE=en
```

---

# 6. Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run format
npm run typecheck
npm test
npm run test:watch
```

---

# 7. Security Requirements

## Mandatory Security Middleware

- Helmet
- CORS whitelist
- Rate limiting
- HPP protection
- Mongo sanitize
- XSS protection
- Compression
- Secure cookies
- Request size limit
- Disable x-powered-by

Example:

```ts
app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: env.CLIENT_URLS,
  credentials: true,
}));
```

---

# 8. Authentication System

## Required Features

- Register
- Login
- Logout
- Refresh token
- Email verification
- Forgot password
- Reset password
- Change password
- Session management
- Device tracking
- Token blacklist
- Account lock after failed attempts

## Token Strategy

### Access Token

- Short lifetime
- 5–15 minutes

### Refresh Token

- Long lifetime
- Stored hashed in database
- Stored in HTTP-only secure cookie

---

# 9. Password Security

## Requirements

- Use Argon2id or bcrypt
- Password policy validation
- Minimum length
- Uppercase required
- Lowercase required
- Number required
- Special character required

---

# 10. Authorization System

## Roles

```txt
SUPER_ADMIN
ADMIN
MODERATOR
USER
GUEST
```

## Permission System

Examples:

```txt
users.read
users.create
users.update
users.delete

roles.read
roles.create
roles.update
roles.delete

uploads.read
uploads.delete

admin.dashboard.read
audit.read
```

## Access Control

Must check:

- Authentication
- Role
- Permission
- Resource ownership
- Account status

---

# 11. Admin API

## Required Routes

```txt
GET    /api/v1/admin/dashboard

GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/status
PATCH  /api/v1/admin/users/:id/roles
DELETE /api/v1/admin/users/:id

GET    /api/v1/admin/roles
POST   /api/v1/admin/roles
PATCH  /api/v1/admin/roles/:id
DELETE /api/v1/admin/roles/:id

GET    /api/v1/admin/permissions

GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/sessions
DELETE /api/v1/admin/sessions/:id

GET    /api/v1/admin/uploads
DELETE /api/v1/admin/uploads/:id

GET    /api/v1/admin/system/health
GET    /api/v1/admin/system/metrics
```

## Admin Security

- Separate admin routes
- Admin middleware
- Audit logging
- Pagination
- Search/filter/sort
- Optional IP allowlist
- Optional admin 2FA

---

# 12. User API

## Required Routes

```txt
GET    /api/v1/users/me
PATCH  /api/v1/users/me
DELETE /api/v1/users/me

PATCH  /api/v1/users/me/password
PATCH  /api/v1/users/me/avatar

GET    /api/v1/users/me/sessions
DELETE /api/v1/users/me/sessions/:id
```

---

# 13. MongoDB Requirements

## Required Models

- User
- Role
- Permission
- Session
- RefreshToken
- AuditLog
- Upload
- Notification
- Setting

## MongoDB Security

- Authentication enabled
- Private network only
- TLS in production
- Least-privilege database user
- Query limits
- Indexes
- Audit logging

---

# 14. MongoDB Transactions

All important write operations must use transactions.

## Transaction Helper

```ts
export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let result!: T;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}
```

## Transaction Example

```ts
await withTransaction(async (session) => {
  const user = await User.create([{ email, password }], { session });

  await AuditLog.create(
    [
      {
        action: "USER_CREATED",
        actorId: user[0]._id,
      },
    ],
    { session }
  );

  return user[0];
});
```

---

# 15. Validation Rules

## Requirements

- Validate body
- Validate params
- Validate query
- Reject unknown fields
- Prevent mass assignment
- Validate ObjectId
- Normalize emails

## Example

```ts
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
}).strict();
```

---

# 16. Multi-language Support

## Supported Languages

```txt
en
fr
ar
```

## Language Detection

```http
Accept-Language: fr
```

## Example Response

```json
{
  "success": false,
  "message": "Email déjà utilisé"
}
```

---

# 17. Socket.IO Configuration

## Features

- Realtime notifications
- User online/offline
- Admin live dashboard
- Chat-ready architecture

## Events

```txt
notification:new
user:online
user:offline
admin:audit-log
upload:completed
```

## Rooms

```txt
user:{userId}
role:admin
system:notifications
```

## Socket Security

- JWT authentication
- Validate payloads
- Rate limit events
- Admin-only rooms
- Disconnect unauthorized users

---

# 18. Redis Cache

## Redis Usage

- API cache
- Rate limit storage
- Token blacklist
- Permission cache
- Session cache
- Email verification cooldown
- Password reset cooldown
- Socket.IO scaling
- Queue management

## Cache Keys

```txt
user:{userId}
permissions:{userId}
settings:public
blacklist:token:{tokenId}
rate-limit:{ip}
```

---

# 19. Background Jobs

## BullMQ Jobs

- send-email
- cleanup-expired-tokens
- cleanup-unverified-users
- delete-cloudinary-file
- generate-report
- security-alert

---

# 20. Mail System

## Required Emails

- Welcome email
- Email verification
- Password reset
- Password changed
- Login from new device
- Account locked
- Admin invitation
- Security alert

## Requirements

- Multi-language templates
- Queue-based sending
- Retry mechanism
- SMTP provider abstraction

---

# 21. Cloudinary Upload

## Supported Uploads

- User avatar
- Admin images
- General image upload

## Security Rules

- Allow only jpeg/png/webp
- Validate MIME type
- Validate file size
- Delete old image after replacement
- Never expose Cloudinary secret

## Upload Model

```ts
{
  ownerId: ObjectId,
  publicId: string,
  secureUrl: string,
  format: string,
  width: number,
  height: number,
  size: number,
  provider: "cloudinary"
}
```

---

# 22. Audit Logs

## Must Log

- Login
- Logout
- Failed login
- Password change
- Email change
- Role change
- Permission change
- User ban/unban
- Upload delete
- Admin actions

## Audit Schema

```ts
{
  actorId,
  targetId,
  action,
  entity,
  before,
  after,
  ip,
  userAgent,
  createdAt
}
```

---

# 23. Response Format

## Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {},
  "errors": null
}
```

## Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "meta": null,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

---

# 24. Scalability Rules

## Required

- Stateless API
- Redis cache
- Background jobs
- Pagination everywhere
- Cursor pagination for large collections
- Database indexes
- No local file storage
- Graceful shutdown
- Health checks

## Avoid

- Unbounded MongoDB queries
- Huge response payloads
- Blocking synchronous tasks

---

# 25. Required MongoDB Indexes

```ts
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ tokenHash: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

# 26. Testing Requirements

## Required Tests

- Auth tests
- User API tests
- Admin API tests
- Permission tests
- Upload tests
- Redis cache tests
- Transaction tests
- Validation tests
- Socket tests

## Coverage Target

```txt
80%
```

---

# 27. API Documentation

## Swagger

```txt
GET /api/v1/docs
```

## Health Check

```txt
GET /api/v1/health
```

## Version

```txt
GET /api/v1/version
```

---

# 28. Production Checklist

## Mandatory

- HTTPS enabled
- Secure cookies
- CORS whitelist
- Redis protected
- MongoDB authentication enabled
- MongoDB private network
- Secrets not committed
- Rate limiting enabled
- Audit logs enabled
- Error stack hidden
- Monitoring enabled
- Backups enabled

---

# 29. Recommended Packages

## Core

```bash
npm install express mongoose redis socket.io jsonwebtoken
```

## Security

```bash
npm install helmet cors express-rate-limit hpp xss-clean express-mongo-sanitize compression
```

## Validation

```bash
npm install zod
```

## Upload

```bash
npm install multer cloudinary
```

## Mail

```bash
npm install nodemailer
```

## Queue

```bash
npm install bullmq
```

## Dev Dependencies

```bash
npm install -D typescript ts-node nodemon eslint prettier jest supertest
```

---

# 30. Final Architecture Recommendation

## Best Architecture Choice

```txt
Node.js + Express.js + TypeScript
MongoDB + Mongoose
Redis
JWT Authentication
RBAC Permissions
MongoDB Transactions
Socket.IO
Cloudinary
BullMQ
Swagger
i18n
```

## Important Rules

- Use validation everywhere
- Use transactions for important writes
- Never trust frontend input
- Never expose sensitive fields
- Use audit logs
- Use centralized error handling
- Use modular architecture
- Use permission-based authorization
- Cache expensive queries
- Queue heavy tasks
- Protect admin routes
- Never store files locally in production
