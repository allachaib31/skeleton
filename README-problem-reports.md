# Problem Reports and Client Support Plan

This file defines the professional support/reporting system needed for `tafa3olcard`.

The goal is to let clients report problems from the shop panel, send messages to admins, attach proof when needed, and let admins manage, assign, answer, resolve, and audit every case from the admin panel.

## First Implementation Pass

- [x] Backend model, validation, service, controller, routes, and route registration.
- [x] Client endpoints for listing, creating, opening, messaging, and closing own reports.
- [x] Admin endpoints for listing, opening, assigning, messaging, status update, and priority update.
- [x] Audit logs for report creation, messages, internal notes, assignment, status changes, priority changes, and client close.
- [x] Notifications for new report, client reply, admin reply, and status update.
- [x] Frontend API, typed hooks, client support pages, admin problem report pages, and navigation entries.
- [x] English, Arabic, and French locale keys for frontend, backend responses, and notification display.
- [x] Backend and frontend typechecks passed.
- [x] Backend test suite passed.
- [x] OpenAPI regenerated.
- [x] Graphify updated.
- [ ] Attachments, read-state counters, bulk actions, quick report buttons from order/payment/product pages, and automated tests.

## Core Concept

- [ ] Build a unified support ticket system named `Problem Reports`.
- [ ] Support reports from client panel and admin panel.
- [ ] Allow reports to be related to orders, payments, wallet movements, products, services, categories, API/provider issues, warehouse fulfillment, account/security, or general support.
- [ ] Allow direct threaded messages between client and admin inside each report.
- [ ] Keep every status change, message, assignment, and resolution auditable.
- [ ] Notify the affected user/admin whenever action is needed.
- [ ] Keep all visible frontend text in i18n files.
- [ ] Keep all backend response messages in backend locale files.

## Report Types

- [ ] Order problem.
- [ ] Payment problem.
- [ ] Wallet/balance problem.
- [ ] Product problem.
- [ ] API/provider problem.
- [ ] Warehouse/manual fulfillment problem.
- [ ] Account/security problem.
- [ ] General support message.
- [ ] Refund request.
- [ ] Missing delivered code/item.
- [ ] Wrong delivered code/item.
- [ ] Provider delayed order.
- [ ] Client says payment was sent but not approved.

## Report Statuses

- [ ] `OPEN`
- [ ] `WAITING_ADMIN`
- [ ] `WAITING_CLIENT`
- [ ] `IN_PROGRESS`
- [ ] `RESOLVED`
- [ ] `REJECTED`
- [ ] `CLOSED`

## Report Priority

- [ ] `LOW`
- [ ] `NORMAL`
- [ ] `HIGH`
- [ ] `URGENT`

## Backend Data Model

### ProblemReport

- [ ] `_id`
- [ ] `reportNumber`
- [ ] `clientId`
- [ ] `assignedAdminId`
- [ ] `type`
- [ ] `status`
- [ ] `priority`
- [ ] `subject`
- [ ] `description`
- [ ] `relatedOrderId`
- [ ] `relatedPaymentRequestId`
- [ ] `relatedFinancialMovementId`
- [ ] `relatedProductId`
- [ ] `relatedServiceId`
- [ ] `relatedCategoryId`
- [ ] `relatedApiId`
- [ ] `relatedWarehouseId`
- [ ] `attachments`
- [ ] `lastMessageAt`
- [ ] `lastMessageBy`
- [ ] `resolvedAt`
- [ ] `closedAt`
- [ ] `resolutionNote`
- [ ] `isDeleted`
- [ ] `deletedAt`
- [ ] `createdBy`
- [ ] `updatedBy`
- [ ] `createdAt`
- [ ] `updatedAt`

### ProblemReportMessage

- [ ] `_id`
- [ ] `reportId`
- [ ] `senderId`
- [ ] `senderRole`
- [ ] `message`
- [ ] `attachments`
- [ ] `isInternal`
- [ ] `readByClientAt`
- [ ] `readByAdminAt`
- [ ] `createdAt`
- [ ] `updatedAt`

## Backend API

### Client APIs

- [ ] `GET /api/v1/problem-reports`
- [ ] `POST /api/v1/problem-reports`
- [ ] `GET /api/v1/problem-reports/:id`
- [ ] `POST /api/v1/problem-reports/:id/messages`
- [ ] `PATCH /api/v1/problem-reports/:id/close`
- [ ] `PATCH /api/v1/problem-reports/:id/read`

### Admin APIs

- [ ] `GET /api/v1/admin/problem-reports`
- [ ] `GET /api/v1/admin/problem-reports/:id`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/assign`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/status`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/priority`
- [ ] `POST /api/v1/admin/problem-reports/:id/messages`
- [ ] `POST /api/v1/admin/problem-reports/:id/internal-notes`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/resolve`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/reject`
- [ ] `PATCH /api/v1/admin/problem-reports/:id/close`
- [ ] `PATCH /api/v1/admin/problem-reports/bulk-update`

## Backend Validation

- [ ] Validate all route params.
- [ ] Validate all query params.
- [ ] Validate report creation body.
- [ ] Validate message body.
- [ ] Validate allowed report types.
- [ ] Validate allowed statuses.
- [ ] Validate allowed priorities.
- [ ] Validate related entity ownership for client-created reports.
- [ ] Validate admin permissions for admin actions.
- [ ] Validate uploads using existing upload policy.
- [ ] Limit message length.
- [ ] Limit number of attachments.
- [ ] Prevent clients from creating reports for another client's order/payment.

## Backend Services

- [ ] `problem-report.model.ts`
- [ ] `problem-report-message.model.ts`
- [ ] `problem-report.validator.ts`
- [ ] `problem-report.controller.ts`
- [ ] `problem-report.service.ts`
- [ ] `problem-report.routes.ts`
- [ ] `admin-problem-report.controller.ts`
- [ ] `admin-problem-report.routes.ts`
- [ ] Register routes in `app.ts`.
- [ ] Add OpenAPI annotations.
- [ ] Regenerate `backend/openapi.json`.

## Permissions and RBAC

- [ ] Add permission `problem_reports.read`.
- [ ] Add permission `problem_reports.assign`.
- [ ] Add permission `problem_reports.reply`.
- [ ] Add permission `problem_reports.update_status`.
- [ ] Add permission `problem_reports.resolve`.
- [ ] Add permission `problem_reports.delete`.
- [ ] Add admin sidebar route only for authorized admins.
- [ ] Clients can only see their own reports.
- [ ] Admins can see all reports based on permission.
- [ ] Assigned admin workflow should prevent conflicting updates if needed.

## Audit Logging

- [ ] Audit when client creates report.
- [ ] Audit when client sends message.
- [ ] Audit when admin sends message.
- [ ] Audit when admin adds internal note.
- [ ] Audit when report is assigned.
- [ ] Audit when priority changes.
- [ ] Audit when status changes.
- [ ] Audit when report is resolved.
- [ ] Audit when report is rejected.
- [ ] Audit when report is closed.
- [ ] Audit when attachment is uploaded.
- [ ] Avoid logging sensitive attachment URLs if private.

## Notifications

- [ ] Notify admins when a client creates a report.
- [ ] Notify assigned admin when report is assigned.
- [ ] Notify client when admin replies.
- [ ] Notify admin when client replies.
- [ ] Notify client when report status changes.
- [ ] Notify client when report is resolved/rejected/closed.
- [ ] Use socket events for real-time updates.
- [ ] Add notification locale keys.

## Client Panel Pages

### `/shop/support`

- [ ] Display client reports table/list.
- [ ] Add filters by status, type, priority, and search.
- [ ] Add pagination.
- [ ] Add button to create new report.
- [ ] Show unread message count per report.
- [ ] Show latest message preview.
- [ ] Show linked order/payment/product when present.

### `/shop/support/new`

- [ ] Form for creating a report.
- [ ] Select report type.
- [ ] Select related order when type is order problem.
- [ ] Select related payment when type is payment problem.
- [ ] Select related product when type is product problem.
- [ ] Subject input.
- [ ] Description textarea.
- [ ] Upload attachments.
- [ ] Submit button.
- [ ] Show validation errors.
- [ ] Redirect to report detail after creation.

### `/shop/support/:id`

- [ ] Display report header.
- [ ] Display status, priority, type, created date, updated date.
- [ ] Display related order/payment/product cards.
- [ ] Display threaded messages.
- [ ] Allow client to send new message.
- [ ] Allow client to upload attachment in message.
- [ ] Allow client to close report when solved.
- [ ] Show admin resolution note when resolved.
- [ ] Mark messages as read when opened.

## Admin Panel Pages

### `/admin/problem-reports`

- [ ] Display reports table using existing admin table patterns.
- [ ] Filters by status, type, priority, assigned admin, client, related order, and search.
- [ ] Pagination.
- [ ] Bulk actions.
- [ ] Quick assign action.
- [ ] Quick status update.
- [ ] Show unread client replies.
- [ ] Show SLA/age indicator.
- [ ] Show priority badges.

### `/admin/problem-reports/:id`

- [ ] Display full report details.
- [ ] Display client profile summary.
- [ ] Display linked order/payment/product/service/category.
- [ ] Display timeline.
- [ ] Display client/admin threaded messages.
- [ ] Allow public reply to client.
- [ ] Allow internal note visible only to admins.
- [ ] Assign to admin.
- [ ] Change status.
- [ ] Change priority.
- [ ] Resolve with resolution note.
- [ ] Reject with reason.
- [ ] Close report.
- [ ] Display audit history link.

## Sidebar and Navigation

- [ ] Add client sidebar item `Support`.
- [ ] Add admin sidebar item `Problem reports`.
- [ ] Add unread count badge in client sidebar.
- [ ] Add open reports count badge in admin sidebar.
- [ ] Add quick report button in order detail page.
- [ ] Add quick report button in payment history.
- [ ] Add quick report button in wallet movements.

## Order Integration

- [ ] On `/shop/orders/:id`, add `Report a problem` button.
- [ ] Pre-fill report type as order problem.
- [ ] Pre-fill related order id.
- [ ] Include order number in report context.
- [ ] Admin can open order directly from report detail.
- [ ] If order is failed or pending manual, report should suggest relevant type.

## Payment Integration

- [ ] On `/shop/wallet`, add report button for payment history rows.
- [ ] Pre-fill payment request id.
- [ ] Show bank/payment gateway details to admin.
- [ ] Admin can approve/reject payment from payment screen, not directly from report unless explicitly allowed.

## Product Integration

- [ ] On product page, allow reporting product issue.
- [ ] Pre-fill product id, service id, category id.
- [ ] Useful for wrong description, unavailable product, wrong price, country issue, requirement issue.

## API Provider Integration

- [ ] Let admin link report to API/provider issue.
- [ ] Show provider request audit log from order if report is order-related.
- [ ] Show provider response/error code when available.
- [ ] Allow admin to resend order via another API from order detail, not directly from report unless opening the order workflow.

## Warehouse Integration

- [ ] Show delivered warehouse items in order-related reports.
- [ ] Allow admin to see warehouse source but hide sensitive code values unless permission allows.

## Uploads and Attachments

- [ ] Support image attachments.
- [ ] Support PDF attachments if upload policy allows.
- [ ] Support max file count.
- [ ] Support max file size.
- [ ] Store upload references using existing upload system.
- [ ] Display attachment previews.
- [ ] Protect private attachments by ownership/RBAC.

## Realtime and Read State

- [ ] Emit socket event when new report is created.
- [ ] Emit socket event when new message is added.
- [ ] Emit socket event when report status changes.
- [ ] Track unread messages for client.
- [ ] Track unread messages for admins.
- [ ] Mark messages read when detail page opens.

## i18n Keys

- [ ] Add frontend keys under `problemReports`.
- [ ] Add admin keys under `adminProblemReports`.
- [ ] Add backend locale keys under `problemReports`.
- [ ] Add notification keys for report events.
- [ ] Add audit action labels if needed.
- [ ] Add all keys in English, Arabic, and French.

## Security Requirements

- [ ] Client ownership checks for every report read/write.
- [ ] Client ownership checks for related order/payment/product context.
- [ ] Admin RBAC checks for all admin report actions.
- [ ] Prevent mass assignment.
- [ ] Sanitize message text display.
- [ ] Validate uploaded files.
- [ ] Do not expose other clients' messages or attachments.
- [ ] Do not expose provider secrets in report context.
- [ ] Rate limit report creation.
- [ ] Rate limit message sending.
- [ ] Avoid stack traces in errors.

## Professional UX Requirements

- [ ] Reports should feel like a support inbox, not a simple form.
- [ ] Client can clearly see who should reply next.
- [ ] Admin can quickly see priority and age.
- [ ] Empty states should explain what to do.
- [ ] Loading states should not shift layout.
- [ ] Mobile layout should keep message thread readable.
- [ ] Long product/order text must wrap safely.
- [ ] RTL must work correctly.
- [ ] Attachments should be easy to inspect.
- [ ] Admin internal notes must be visually distinct.

## Suggested Build Order

- [ ] Create backend models and validators.
- [ ] Create client API endpoints.
- [ ] Create admin API endpoints.
- [ ] Add audit logs.
- [ ] Add notifications and socket events.
- [ ] Add frontend API/hooks/types.
- [ ] Build client support list page.
- [ ] Build client create report page.
- [ ] Build client report detail with messages.
- [ ] Build admin report list page.
- [ ] Build admin report detail page.
- [ ] Add integrations to order/payment/product pages.
- [ ] Add i18n keys.
- [ ] Add tests.
- [ ] Regenerate OpenAPI.
- [ ] Run Graphify update.

## Tests

- [ ] Client can create report for own order.
- [ ] Client cannot create report for another client's order.
- [ ] Client can list only own reports.
- [ ] Client can send message to own report.
- [ ] Client cannot message another client's report.
- [ ] Admin can list reports with permission.
- [ ] Admin can assign report.
- [ ] Admin can reply to report.
- [ ] Admin can add internal note.
- [ ] Admin can resolve report.
- [ ] Notifications are created for new report and new message.
- [ ] Audit logs are created for important actions.
- [ ] Upload validation rejects invalid files.
- [ ] Pagination and filters work.
- [ ] i18n keys exist in all supported languages.

## Definition of Done

- [ ] Backend typecheck passes.
- [ ] Frontend typecheck passes.
- [ ] Tests pass.
- [ ] OpenAPI regenerated.
- [ ] Graphify updated.
- [ ] All visible frontend text translated.
- [ ] All backend responses translated.
- [ ] Audit logs added.
- [ ] Notifications added.
- [ ] RBAC and ownership checks completed.
- [ ] No static/mock data remains in support pages.
