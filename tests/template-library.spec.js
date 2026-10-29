const { test, expect } = require('@playwright/test');

test('template library contains only the Folder Blog demo', async ({ page }) => {
  await page.goto('/admin/templates.html');
  await expect(page.locator('.tpl-card')).toHaveCount(1);
  await expect(page.locator('#statTotal')).toHaveText('1');
  await expect(page.locator('.tpl-card').first()).toContainText(/Folder Blog/i);

  const preview = page.locator('.tpl-card a').first();
  await expect(preview).toHaveAttribute('href', /\/#folderblog/);
});

test('template library has no horizontal overflow', async ({ page }) => {
  await page.goto('/admin/templates.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
