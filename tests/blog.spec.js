const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('blog keeps category tabs, all three preview modes, cards and the pet', async ({ page }) => {
  test.setTimeout(120000);
  const mediaRequests = [];
  page.on('request', request => {
    if (request.url().includes('music.163.com')) mediaRequests.push(request.url());
  });

  await page.goto('/blog.html');
  await page.waitForTimeout(1500);

  const tabs = page.locator('#tabbar a');
  expect(await tabs.count()).toBeGreaterThanOrEqual(4);
  const tabTexts = (await tabs.allTextContents()).join(' ');
  expect(tabTexts).toContain('学会成长');
  expect(tabTexts).not.toMatch(/心情随笔|思维日记|建站笔记|未分类/);
  expect(await page.locator('#view-switcher button[data-view]').count()).toBe(3);

  const cards = page.locator('.post-grid > .post-card');
  expect(await cards.count()).toBe(10);
  await expect(cards.first()).toBeVisible();

  for (const mode of ['list', 'folder', 'gallery']) {
    await page.locator(`#view-switcher button[data-view="${mode}"]`).click();
    await expect(page.locator('#content-area')).toHaveClass(new RegExp(`view-${mode}`));
    expect(await cards.count()).toBe(10);
    expect(await cards.evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height > 0).length)).toBe(10);
  }

  const pet = page.locator('#pet-wrap');
  await expect(pet).toBeVisible();
  const box = await pet.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeLessThan(viewport.width);
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 20);

  expect(mediaRequests).toHaveLength(0);
});


test('merged categories and real-page demo deck article render', async ({ page }) => {
  await page.goto('/p/website-experience-ideas');
  await page.waitForTimeout(1000);
  await expect(page.locator('[data-deck]')).toHaveCount(1);
  await expect(page.locator('[data-card]')).toHaveCount(2);
  await expect(page.locator('[data-now]')).toHaveText('01');
  await expect(page.locator('[data-card] video').first()).toBeVisible();
  await page.locator('[data-next]').click();
  await page.waitForTimeout(700);
  await expect(page.locator('[data-now]')).toHaveText('02');
  await expect(page.locator('.rd-dot.on')).toHaveCount(1);
  await expect(page.locator('[data-card] video').nth(1)).toBeVisible();

  await page.goto('/p/procurement-pitfalls');
  await page.waitForTimeout(700);
  await expect(page.locator('.a-title')).toContainText('采购的坑');
  await expect(page.locator('#a-body h2')).toHaveCount(9);
});
