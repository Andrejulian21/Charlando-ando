import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.js';

test.describe('Server List (Authenticated)', () => {
  test('should show server list after login', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page).toHaveURL(/\/chat/);
    // The server sidebar is a nav with aria-label "Servidores"
    const sidebar = page.locator('nav[aria-label="Servidores"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    // The DM section should be visible
    await expect(page.locator('text=Mensajes directos')).toBeVisible({ timeout: 10000 });
  });
});