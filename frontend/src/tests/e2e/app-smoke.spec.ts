import { expect, Page, test } from '@playwright/test';

const user = {
  _id: 'user-1',
  name: 'Test Admin',
  email: 'admin@example.com',
  role: {
    _id: 'role-1',
    name: 'SUPER_ADMIN',
    permissions: [{ _id: 'permission-1', name: 'admin.dashboard.read', module: 'admin' }],
  },
  status: 'active',
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
};

const apiResponse = (data: unknown, message = 'OK') => ({
  success: true,
  message,
  data,
  meta: null,
  errors: null,
});

const mockAuthenticatedApi = async (page: Page) => {
  await page.route('**/api/v1/auth/refresh-token', async (route) => {
    await route.fulfill({ json: apiResponse({ accessToken: 'test-token' }) });
  });

  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({ json: apiResponse(user) });
  });

  await page.route('**/api/v1/admin/dashboard', async (route) => {
    await route.fulfill({
      json: apiResponse({
        users: { total: 1, new: { today: 1, week: 1 }, byStatus: { active: 1 } },
        storage: { totalUploads: 0, storageUsedBytes: 0 },
        recentAuditLogs: [],
        system: { uptime: 1, memory: { heapUsed: 1, heapTotal: 2 }, db: true, redis: true },
      }),
    });
  });

  await page.route('**/api/v1/notifications**', async (route) => {
    await route.fulfill({
      json: apiResponse({
        data: [{ _id: 'n1', title: 'Welcome', message: 'Hello', type: 'info', isRead: false, createdAt: new Date().toISOString() }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    });
  });
};

test.describe('authenticated app smoke', () => {
  test('loads profile, dashboard, notifications, and admin dashboard', async ({ page }) => {
    await mockAuthenticatedApi(page);

    await page.goto('/app/profile');
    await expect(page.getByRole('heading', { name: 'Test Admin' })).toBeVisible();

    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/app\/dashboard/);

    await page.goto('/app/notifications');
    await expect(page.getByText('Welcome')).toBeVisible();

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});
