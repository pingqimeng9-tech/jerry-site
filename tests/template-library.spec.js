const { test, expect } = require('@playwright/test');

test('template library filters, favorites, and preview links work', async ({ page }) => {
  await page.goto('/admin/templates.html');
  await expect(page.locator('.tpl-card')).toHaveCount(29);
  await expect(page.locator('#statTotal')).toHaveText('29');

  await page.locator('#search').fill('glass');
  await expect(page.locator('.tpl-card')).toHaveCount(3);
  await expect(page.locator('.tpl-card').first()).toContainText(/Glass/i);

  await page.locator('#search').fill('');
  await page.locator('.tpl-star').first().click();
  await expect(page.locator('#statFav')).toHaveText('1');
  await page.locator('#favOnly').click();
  await expect(page.locator('.tpl-card')).toHaveCount(1);

  const preview = page.locator('.tpl-card a').first();
  await expect(preview).toHaveAttribute('href', /\/#/);
});

test('template library has no horizontal overflow', async ({ page }) => {
  await page.goto('/admin/templates.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
