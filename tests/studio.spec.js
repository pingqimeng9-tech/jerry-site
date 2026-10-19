const { test, expect } = require('@playwright/test');

test('studio renders components and updates the live preview', async ({ page }) => {
  await page.route('**/api/config/stage', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.route('**/api/config/apply', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"applied":["test"]}' }));

  await page.goto('/admin/studio.html');
  await expect(page.locator('.comp-card')).toHaveCount(2);
  await expect(page.locator('#inspector .cms-field')).toHaveCount(6);

  const bgStyle = page.locator('.cms-field[data-field="style"] select');
  await bgStyle.selectOption('mesh');
  await expect(page.locator('#studioBg')).toHaveAttribute('style', /radial-gradient/);

  await page.locator('.comp-card[data-id="profile"]').click();
  await page.locator('.cms-field[data-field="authorName"] input').fill('Studio 测试');
  await expect(page.locator('.sp-profile-name')).toHaveText('Studio 测试');

  await page.locator('#btnSave').click();
  await expect(page.locator('#saveState')).toHaveText('已保存');
  await expect(page.locator('#toast')).toContainText('已保存');
});

test('studio has no horizontal overflow', async ({ page }) => {
  await page.goto('/admin/studio.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
