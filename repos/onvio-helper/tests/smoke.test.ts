import { test, expect } from '@playwright/test';

test('smoke: browser launch and navigation', async ({ page }) => {
  await page.goto('https://www.google.com');
  await expect(page).toHaveTitle(/Google/);
});
