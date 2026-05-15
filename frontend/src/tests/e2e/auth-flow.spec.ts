import { expect, test } from '@playwright/test';

const apiResponse = (data: unknown, message = 'OK') => ({
  success: true,
  message,
  data,
  meta: null,
  errors: null,
});

test.describe('auth submit flows', () => {
  test('submits login successfully', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        json: apiResponse({
          user: {
            _id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            role: { _id: 'role-1', name: 'USER', permissions: [] },
            status: 'active',
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
          },
          accessToken: 'token',
        }),
      });
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(page).toHaveURL(/\/app\//);
  });

  test('submits registration successfully', async ({ page }) => {
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        json: apiResponse({
          user: {
            _id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            role: { _id: 'role-1', name: 'USER', permissions: [] },
            status: 'pending_verification',
            isEmailVerified: false,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Password123!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
  });
});
