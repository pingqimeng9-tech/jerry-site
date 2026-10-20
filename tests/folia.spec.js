const { test, expect } = require('@playwright/test');

test('music route opens Folia', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Folia smoke test runs once');
  test.setTimeout(120000);
  await page.goto('/music.html');
  await page.waitForURL('**/folia/', { timeout: 30000 });
  await expect(page).toHaveTitle('Folia', { timeout: 30000 });
  await expect(page.locator('#root')).toHaveCount(1);
});
