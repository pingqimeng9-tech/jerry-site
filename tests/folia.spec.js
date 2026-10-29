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
  await expect(page.locator('.bravais-field')).toBeVisible();
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


test('Folia mobile Bravais keeps its nav pinned left', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile Bravais only');
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
  const navWidth = await page.locator('#jerry-top-nav nav').evaluate(nav => ({ scroll: nav.scrollWidth, client: nav.clientWidth }));
  expect(navWidth.scroll).toBeLessThanOrEqual(navWidth.client + 1);
});


test('Folia mobile Bravais pans in both directions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile Bravais only');
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
  expect(afterHorizontal.x).not.toBe(before.x);

  await page.mouse.move(field.x + 200, field.y + 480);
  await page.mouse.down();
  await page.mouse.move(field.x + 200, field.y + 600, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const afterVertical = await tilePosition();
  expect(afterVertical.y).not.toBe(before.y);
});

test('Folia mobile logged-in wall renders and the page does not overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile wall only');
  test.setTimeout(120000);
  const svg = (label, background) => `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${background}"/><text x="50%" y="50%" fill="#fff" font-size="64" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`;
  const profile = { userId: 1001, nickname: 'Fixture Listener', avatarUrl: svg('User', '#2563eb'), backgroundUrl: svg('BG', '#0f172a') };
  const playlists = [
    { id: 9001, name: 'Daily Mix', coverImgUrl: svg('Mix', '#ef4444'), trackCount: 18, playCount: 1204, updateTime: 1710000000000, trackUpdateTime: 1710000000000, specialType: 0 },
    { id: 9002, name: 'Late Night Drive', coverImgUrl: svg('Drive', '#7c3aed'), trackCount: 32, playCount: 420, updateTime: 1710000000000, trackUpdateTime: 1710000000000, specialType: 0 },
  ];
  await page.addInitScript(() => {
    localStorage.setItem('netease_cookie', 'fixture-cookie');
    localStorage.setItem('library_suite', 'bravais');
    localStorage.setItem('library_suite_prompt_seen', 'true');
    localStorage.setItem('folia_last_seen_guide_version', '0.7.21');
    localStorage.setItem('folia_last_seen_ponder_onboarding_version', '0.7.21');
    localStorage.setItem('playback_entry_view', 'player');
    localStorage.setItem('playback_entry_view_chosen', 'true');
    localStorage.setItem('always_show_track_switch_buttons', 'true');
  });
  await page.route('**/api/netease/**', async route => {
    const endpoint = new URL(route.request().url()).pathname.replace('/api/netease', '');
    let body = { code: 200 };
    if (endpoint === '/login/status') body = { code: 200, data: { profile }, cookie: 'fixture-cookie' };
    else if (endpoint === '/user/account') body = { code: 200, account: { id: 1001 }, profile };
    else if (endpoint === '/user/playlist') body = { code: 200, playlist: playlists.map(item => ({ ...item, creator: profile, description: `${item.name} fixture` })) };
    else if (endpoint === '/likelist') body = { code: 200, ids: [7001, 7002, 7003] };
    else if (endpoint === '/user/cloud') body = { code: 200, count: 0, songs: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/listen/');
  await page.waitForTimeout(9000);

  const layout = await page.evaluate(() => {
    const seam = document.querySelector('.bravais-seam').getBoundingClientRect();
    const tiles = Array.from(document.querySelectorAll('.bravais-tile'))
      .filter(tile => getComputedStyle(tile).visibility !== 'hidden')
      .map(tile => tile.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0);
    return {
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      seamRight: seam.right,
      visible: tiles.length,
      clipped: tiles.filter(rect => rect.left < seam.right - 1 || rect.right > window.innerWidth + 1).length,
      images: document.querySelectorAll('.lattice-poster img').length,
      autoDegraded: sessionStorage.getItem('folia_auto_degraded'),
      visualizerBackground: localStorage.getItem('visualizer_background_mode'),
      visualizerFrameRate: localStorage.getItem('visualizer_frame_rate'),
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.visible).toBeGreaterThan(0);
  expect(layout.autoDegraded).toBeNull();
  expect(layout.visualizerBackground).toBeNull();
  expect(layout.visualizerFrameRate).toBeNull();
});

test('Folia mobile can switch to the desktop fallback and back', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile layout fallback only');
  test.setTimeout(120000);
  await page.goto('/listen/');
  await page.waitForTimeout(6500);

  const layoutSwitch = page.locator('.jerry-layout-switch');
  await expect(layoutSwitch).toBeVisible();
  await layoutSwitch.click({ force: true });
  await page.waitForURL('**/listen/desktop.html', { timeout: 30000 });
  await expect(page).toHaveTitle(/Folia.*电脑版/);
  await expect(page.locator('#jerry-desktop-return')).toBeVisible();
  await expect(page.locator('#jerry-top-nav')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.__JERRY_DESKTOP__))).toBe(true);
  const seam = await page.locator('.bravais-seam').boundingBox();
  expect(seam.x).toBeGreaterThan(100);

  await page.locator('#jerry-desktop-return').click();
  await page.waitForURL(/\/listen\/$/, { timeout: 30000 });
  await expect(page.locator('#jerry-top-nav')).toHaveCount(1);
});
