const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('Folder Blog template is a single copy of the blog folder card', async ({ page }) => {
  await page.goto('/#folderblog');
  await expect(page.locator('.fb')).toBeVisible();
  await expect(page.locator('.fb-card')).toHaveCount(1);
  await expect(page.locator('.fb-seg')).toHaveCount(0);
  await expect(page.locator('.fb-front h3')).toHaveText('脱离固有思维');
  await expect(page.locator('.fb-front p')).toContainText('有边界的思维');
  expect(await page.locator('.fb-cov img').getAttribute('src')).toContain('ndfc39abe-cover');
  expect(await page.locator('.fb-chapter')).toHaveCount(3);

  const card = page.locator('.fb-card');
  await card.click();
  await expect(card).toHaveClass(/open/);
  await card.click();
  await expect(card).not.toHaveClass(/open/);
});

test('article links are short English slugs and old article links redirect', async ({ page }) => {
  await page.goto('/blog.html');
  await page.waitForTimeout(1200);
  const href = await page.locator('.post-grid > .post-card').first().getAttribute('href');
  expect(href).toMatch(/^\/p\/[a-z0-9-]+$/);

  await page.goto('/p/%E8%84%B1%E7%A6%BB%E5%9B%BA%E6%9C%89%E6%80%9D%E7%BB%B4-dfc39abe');
  await expect(page).toHaveURL(/\/p\/detach-from-fixed-mindset$/);
  await expect(page.locator('.a-title')).toContainText('脱离固有思维');
});
