import { expect } from '@playwright/test';

export async function loginAsTestUser(page) {
  await page.goto('/dev-login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input#email', { timeout: 15000 });
  await page.fill('input#email', 'e2e@test.com');
  await page.fill('input#password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/chat/, { timeout: 15000 });
  await page.context().storageState({ path: 'e2e/.auth-state.json' });
}

export async function isAuthenticated(page) {
  try {
    await page.goto('/chat');
    await page.waitForURL(/\/chat/, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}