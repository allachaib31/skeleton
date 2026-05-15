import { expect, Page, test } from '@playwright/test';

const apiResponse = (data: unknown, message = 'OK') => ({
  success: true,
  message,
  data,
  meta: null,
  errors: null,
});

const mockAdmin = async (page: Page) => {
  await page.route('**/api/v1/auth/refresh-token', async (route) => {
    await route.fulfill({ json: apiResponse({ accessToken: 'admin-token' }) });
  });

  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      json: apiResponse({
        _id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com',
        role: {
          _id: 'role-1',
          name: 'SUPER_ADMIN',
          permissions: [{ _id: 'p1', name: 'admin.dashboard.read', module: 'admin' }],
        },
        status: 'active',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/v1/admin/languages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        json: apiResponse({ code: 'es', name: 'Español', direction: 'ltr', isCustom: true }),
      });
      return;
    }

    await route.fulfill({
      json: apiResponse([{ code: 'en', name: 'English', direction: 'ltr', isDefault: true, isCustom: false }]),
    });
  });

  await page.route('**/api/v1/admin/languages/template', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ common: { save: 'Save' } }, null, 2),
    });
  });
};

test.describe('admin language management', () => {
  test('downloads template model and uploads translated JSON', async ({ page }) => {
    await mockAdmin(page);
    await page.goto('/admin/languages');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download model json/i }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('language');

    await page.getByLabel(/language code/i).fill('es');
    await page.getByLabel(/language name/i).fill('Español');
    await page.getByLabel(/translated json file/i).setInputFiles({
      name: 'es.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ common: { save: 'Guardar' } })),
    });
    await page.getByRole('button', { name: /upload language/i }).click();
  });
});
