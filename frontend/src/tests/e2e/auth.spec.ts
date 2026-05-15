import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/app/profile');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow navigation to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/the ultimate react/i)).toBeVisible();
  });

  test('should allow navigation to about page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/our mission/i)).toBeVisible();
  });

  test('should show validation errors on login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});
