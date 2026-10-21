const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });


test('music route opens Folia', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Folia smoke test runs once');
  test.setTimeout(120000);
  await page.goto('/music.html');
  await page.waitForURL('**/listen/', { timeout: 30000 });
  await expect(page).toHaveTitle(/callmiruko\.cc.*Folia/, { timeout: 30000 });
  await expect(page.locator('#root')).toHaveCount(1);
});

test('Folia opens directly on the grid search home', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Folia smoke test runs once');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await expect(page).toHaveTitle(/callmiruko\.cc.*Folia/, { timeout: 30000 });
  await page.waitForTimeout(6500);
  await expect(page.locator('input[placeholder*="search" i], input[placeholder*="搜索"]')).toHaveCount(1);
});

test('Folia mobile portrait fits the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile portrait only');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await expect(page).toHaveTitle(/callmiruko\.cc.*Folia/, { timeout: 30000 });
  await page.waitForTimeout(6500);
  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.height + 1);
  await expect(page.locator('#jerry-mobile-grid')).toBeVisible();
});

test('Folia mobile player exposes a persistent transport without overlap', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile player only');
  test.setTimeout(120000);
  await page.route('**/api/netease/song/url/v1*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 200, data: [{ id: 1442466883, url: 'https://example.com/x.wav', br: 128000, size: 0, code: 200, type: 'mp3', level: 'standard' }] })
  }));
  await page.goto('/listen/');
  await page.waitForTimeout(6500);
  await page.locator('button[aria-label="Search online platforms"]').first().click();
  await page.waitForTimeout(800);
  const search = page.locator('input[placeholder*="search" i], input[placeholder*="搜索"]').first();
  await search.fill('花に亡霊');
  await search.press('Enter');
  await page.waitForTimeout(4000);
  await page.locator('button:has-text("花に亡霊")').first().click({ force: true });
  await page.waitForTimeout(4500);

  const bar = page.locator('#folia-mobile-transport');
  await expect(bar).toBeVisible();
  await expect(bar.locator('.fmt-play')).toBeVisible();
  await expect(bar.locator('.fmt-prev')).toBeEnabled();
  await expect(bar.locator('.fmt-next')).toBeEnabled();
  await expect(bar.locator('.fmt-text b')).toContainText('花に亡霊');
  await expect(page.locator('.fmt-original-card')).toBeHidden();
  const rect = await bar.evaluate(el => {
    const box = el.getBoundingClientRect();
    return { y: box.y, height: box.height };
  });
  expect(rect.y + rect.height).toBeLessThanOrEqual(845);
});


test('Folia mobile Bravais keeps its nav pinned left and can switch to Grid', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile Bravais only');
  test.skip(true, 'Mobile uses the bounded guest grid in phase 2; wall panning returns with the account grid');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await page.waitForTimeout(6500);
  const seam = await page.locator('.bravais-seam').boundingBox();
  expect(seam.x).toBe(0);
  await expect(page.locator('.jerry-suite-switch')).toBeVisible();
  await expect(page.locator('.jerry-site-links')).toHaveCount(0);

  const field = await page.locator('.bravais-field').boundingBox();
  await page.mouse.move(field.x + 200, field.y + 320);
  await page.mouse.down();
  await page.mouse.move(field.x + 200, field.y + 440, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('#jerry-top-nav')).toHaveClass(/show/);
  await expect(page.locator('#jerry-top-nav nav a')).toHaveCount(6);

  await page.locator('.jerry-suite-switch').click({ force: true });
  await page.waitForTimeout(6500);
  await expect(page.locator('input[placeholder*="search" i], input[placeholder*="搜索"]')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('library_suite'))).toBe('grid');
});


test('Folia mobile Bravais pans vertically only', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile Bravais only');
  test.skip(true, 'Mobile uses the bounded guest grid in phase 2; wall panning returns with the account grid');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await page.waitForTimeout(6500);
  const field = await page.locator('.bravais-field').boundingBox();
  const tilePosition = () => page.evaluate(() => {
    const tile = document.querySelector('.bravais-tile');
    const rect = tile && tile.getBoundingClientRect();
    return rect && { x: Math.round(rect.x), y: Math.round(rect.y) };
  });
  const before = await tilePosition();
  await page.mouse.move(field.x + 200, field.y + 400);
  await page.mouse.down();
  await page.mouse.move(field.x + 300, field.y + 400, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const afterHorizontal = await tilePosition();
  expect(afterHorizontal).toEqual(before);

  await page.mouse.move(field.x + 200, field.y + 480);
  await page.mouse.down();
  await page.mouse.move(field.x + 200, field.y + 600, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const afterVertical = await tilePosition();
  expect(afterVertical.y).not.toBe(before.y);
});

test('Folia mobile guest grid stays inside the bounded content area', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile guest grid only');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await page.waitForTimeout(7000);

  const grid = page.locator('#jerry-mobile-grid');
  await expect(grid).toBeVisible();
  await expect(grid.locator('.jmg-card')).toHaveCount(8);
  await expect(grid).toContainText('先听一首');

  const layout = await page.evaluate(() => {
    const root = document.getElementById('jerry-mobile-grid');
    const box = root.getBoundingClientRect();
    const cards = Array.from(root.querySelectorAll('.jmg-card')).map(card => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const nav = document.querySelector('#jerry-top-nav nav');
    return {
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      gridLeft: box.left,
      gridRight: box.right,
      minLeft: Math.min(...cards.map(card => card.left)),
      maxRight: Math.max(...cards.map(card => card.right)),
      navScrollWidth: nav ? nav.scrollWidth : 0,
      navClientWidth: nav ? nav.clientWidth : 0,
      edgeMask: Boolean(document.getElementById('jerry-edge-mask')),
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.minLeft).toBeGreaterThanOrEqual(layout.gridLeft - 1);
  expect(layout.maxRight).toBeLessThanOrEqual(layout.gridRight + 1);
  expect(layout.navScrollWidth).toBeLessThanOrEqual(layout.navClientWidth + 1);
  expect(layout.edgeMask).toBe(false);
});
