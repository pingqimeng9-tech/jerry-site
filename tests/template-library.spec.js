const { test, expect } = require('@playwright/test');

test('template library filters, favorites, and preview links work', async ({ page }) => {
  await page.goto('/admin/templates.html');
  await expect(page.locator('.tpl-card')).toHaveCount(30);
  await expect(page.locator('#statTotal')).toHaveText('30');

  await page.locator('#search').fill('glass');
  await expect(page.locator('.tpl-card')).toHaveCount(4);
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


test('shark glass chat template mounts and sends a message', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/#asciisharks');
  await expect(page.locator('.as-canvas')).toBeVisible();
  await expect(page.locator('.as-chat')).toBeVisible();
  await expect(page.locator('.as-msg')).toHaveCount(2, { timeout: 8000 });
  await page.locator('.as-form input').fill('这里有鲨鱼吗？');
  await page.locator('.as-form button').click();
  await expect(page.locator('.as-msg')).toHaveCount(3);
  await expect(page.locator('.as-msg').last()).toContainText('这里有鲨鱼吗？');
});
