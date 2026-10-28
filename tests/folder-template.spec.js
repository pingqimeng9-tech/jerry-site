const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('Folder Blog template copies folder, list, and gallery views with editable corners', async ({ page }) => {
  await page.goto('/#folderblog');
  await expect(page.locator('.fb')).toBeVisible();
  await expect(page.locator('.fb-folder')).toHaveCount(6);
  await expect(page.locator('.fb-seg button')).toHaveCount(3);
  await expect(page.locator('.fb-seg button[data-v="folder"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.fb-bg').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('ndfc39abe-cover');

  const first = page.locator('.fb-folder').first();
  await first.click();
  await expect(first).toHaveClass(/open/);
  await expect.poll(() => first.locator('.fb-chapter').first().evaluate(el => getComputedStyle(el).opacity)).toBe('1');

  await page.locator('.fb-edit').click();
  expect(await first.locator('.fb-front-title').getAttribute('contenteditable')).toBe('true');
  await page.locator('.fb-edit').click();

  await page.locator('.fb-quad').click();
  await expect(page.locator('.fb-quad-handle')).toHaveCount(4);
  const before = await first.locator('.fb-glass-inner').evaluate(el => getComputedStyle(el).transform);
  const handle = await page.locator('.fb-quad-handle').first().boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 32, handle.y + 18, { steps: 8 });
  await page.mouse.up();
  const after = await first.locator('.fb-glass-inner').evaluate(el => getComputedStyle(el).transform);
  expect(after).not.toBe(before);

  await page.locator('.fb-seg button[data-v="list"]').click();
  expect(await page.locator('.fb-row').count()).toBe(6);
  await page.locator('.fb-seg button[data-v="gallery"]').click();
  expect(await page.locator('.fb-gallery .fb-card').count()).toBe(6);
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
