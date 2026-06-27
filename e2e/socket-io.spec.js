import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.js';
import { emitSocketEvent, isRedisAvailable } from './helpers/redis.js';

test.describe('Socket.io Real-time', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await isRedisAvailable()), 'Redis not available');
  });

  test('should receive a real-time message', async ({ page }) => {
    await loginAsTestUser(page);

    await page.waitForSelector('[data-testid="chat-messages"], .message-list', { timeout: 10000 });

    const msgContent = `E2E test message ${Date.now()}`;
    const emitted = await emitSocketEvent('chat', 'message', {
      id: Date.now(),
      user: { name: 'Test User' },
      content: msgContent,
      created_at: new Date().toISOString(),
    });
    expect(emitted).toBe(true);

    await expect(page.locator(`text=${msgContent}`)).toBeVisible({ timeout: 10000 });
  });
});