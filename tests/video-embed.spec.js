const { test, expect } = require('@playwright/test');

const VIDEO_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

test('editor inserts a video link card and round-trips it through markdown', async ({ page }) => {
  await page.goto('/admin/editor.html?id=new');
  await page.locator('#toolbar .tb-video').click();
  await expect(page.locator('#videoUrlInput')).toBeVisible();

  await page.locator('#videoUrlInput').fill(VIDEO_URL);
  await page.locator('#videoTitleInput').fill('测试视频卡片');
  await expect(page.locator('#videoUrlHint')).toContainText('已识别');

  await page.locator('#videoUrlInsert').click();
  const card = page.locator('#body .video-link-card');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute('data-provider', 'youtube');
  await expect(card.locator('.vl-title')).toHaveText('测试视频卡片');

  const markdown = await page.evaluate(() => htmlToMd(document.getElementById('body')));
  expect(markdown).toContain('video-link-card');
  expect(markdown).toContain('youtube.com');
  expect(markdown).not.toContain('data-vl-bound');

  const roundTrip = await page.evaluate((md) => mdToHtml(md), markdown);
  expect(roundTrip).toContain('video-link-card');
});

test('video demo page parses a link and plays an embeddable video', async ({ page }) => {
  await page.goto('/video-demo.html');
  await page.locator('#url').fill(VIDEO_URL);
  await page.locator('#title').fill('演示视频');
  await expect(page.locator('#hint')).toContainText('YouTube');

  await page.locator('#make').click();
  const card = page.locator('#preview .video-link-card');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.vl-title')).toHaveText('演示视频');

  await card.locator('[data-vl-play]').click();
  await expect(card.locator('.vl-player iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed/);
});

test('video demo page has no horizontal overflow on mobile', async ({ page }) => {
  await page.goto('/video-demo.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
