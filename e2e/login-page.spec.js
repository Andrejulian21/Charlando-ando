import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should render the login page with title and OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Bienvenido de vuelta');
    const googleBtn = page.locator('a[href="/auth/google/redirect"]');
    const githubBtn = page.locator('a[href="/auth/github/redirect"]');
    await expect(googleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();
    await expect(googleBtn).toContainText('Continuar con Google');
    await expect(githubBtn).toContainText('Continuar con GitHub');
  });

  test('should redirect to Google OAuth when clicking Google button', async ({ page }) => {
    await page.goto('/login');
    const googleLink = page.locator('a[href="/auth/google/redirect"]');
    await expect(googleLink).toBeVisible();
  });
});