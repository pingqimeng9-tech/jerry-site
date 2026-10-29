const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('Folder Blog is one black-and-white folder with the article cover, corners and editable text', async ({ page }) => {
  await page.goto('/#folderblog');
  await expect(page.locator('.fb')).toBeVisible();
  await expect(page.locator('.fb-folder')).toHaveCount(1);
  await expect(page.locator('.fb-seg')).toHaveCount(0);
  await expect(page.locator('.fb-copy h2')).toHaveText('论平衡时间优先级');
  expect(await page.locator('.fb-cover').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('nc1939abe-cover');
  expect(await page.locator('.fb-bg').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('nc1939abe-cover');

  const folder = page.locator('.fb-folder');
  await folder.click();
  await expect(folder).toHaveClass(/open/);

  await page.locator('.fb-edit').click();
  expect(await page.locator('.fb-copy h2').getAttribute('contenteditable')).toBe('true');
  await page.locator('.fb-edit').click();

  await page.locator('.fb-quad').click();
  await expect(page.locator('.fb-handle')).toHaveCount(4);
  const before = await page.locator('.fb-cover').evaluate(el => getComputedStyle(el).transform);
  const handle = await page.locator('.fb-handle').first().boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 36, handle.y + 20, { steps: 8 });
  await page.mouse.up();
  const after = await page.locator('.fb-cover').evaluate(el => getComputedStyle(el).transform);
  expect(after).not.toBe(before);
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
