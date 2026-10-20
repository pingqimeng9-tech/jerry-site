const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });


test('music route opens Folia', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Folia smoke test runs once');
  test.setTimeout(120000);
  await page.goto('/music.html');
  await page.waitForURL('**/folia/', { timeout: 30000 });
  await expect(page).toHaveTitle('Folia', { timeout: 30000 });
  await expect(page.locator('#root')).toHaveCount(1);
});

test('Folia opens directly on the grid search home', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Folia smoke test runs once');
  test.setTimeout(120000);
  await page.goto('/folia/');
  await expect(page).toHaveTitle('Folia', { timeout: 30000 });
  await page.waitForTimeout(6500);
  await expect(page.locator('input[placeholder*="SEARCH"], input[placeholder*="搜索"]')).toHaveCount(1);
});
