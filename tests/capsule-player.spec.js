const { test, expect } = require('@playwright/test');

test('site keeps the music player but removes the capsule scrollbar', async ({ page }) => {
  await page.route('**/api/assist?do=music*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"songs":[]}' }));
  await page.goto('/blog.html');
  await expect(page.locator('#jm')).toHaveCount(1);
  await expect(page.locator('#jcap')).toHaveCount(0);
  await expect(page.locator('nav .links a[href="/music.html"]')).toHaveCount(1);
  const scrollbarWidth = await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth);
  expect(scrollbarWidth).not.toBe('none');
});
