const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('Folder Blog template exposes four warped corners, editable text, and an unfolding cover', async ({ page }) => {
  await page.goto('/#folderblog');
  await expect(page.locator('.fbx')).toBeVisible();
  await expect(page.locator('.fbx-handle')).toHaveCount(4);
  await expect(page.locator('.fbx-cover-text h2')).toHaveText('脱离固有思维');
  expect(await page.locator('.fbx-cover').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('ndfc39abe-cover');
  expect(await page.locator('.fbx-cover-text h2').getAttribute('contenteditable')).toBe('true');

  const before = await page.locator('.fbx-cover').evaluate(el => getComputedStyle(el).transform);
  const handle = await page.locator('.fbx-handle').first().boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 48, handle.y + 24, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const after = await page.locator('.fbx-cover').evaluate(el => getComputedStyle(el).transform);
  expect(after).not.toBe(before);

  await page.locator('.fbx-toggle').click();
  await expect(page.locator('.fbx')).toHaveClass(/open/);
  expect(await page.locator('.fbx-handle').first().evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  await page.locator('.fbx-toggle').click();
  await expect(page.locator('.fbx')).not.toHaveClass(/open/);
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
