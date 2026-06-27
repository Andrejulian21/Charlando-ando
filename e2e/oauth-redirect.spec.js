import { test, expect } from '@playwright/test';

test.describe('OAuth Redirect', () => {
  test('should redirect to Google accounts URL', async ({ page }) => {
    await page.goto('/auth/google/redirect');
    await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });
    expect(page.url()).toContain('accounts.google.com');
  });
});