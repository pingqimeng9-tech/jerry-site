const { test, expect } = require('@playwright/test');

test('music page loads the default playlist and supports add/remove', async ({ page }) => {
  await page.route(/https:\/\/p\d+\.music\.126\.net\/.*/, route => route.abort());
  await page.route('**/api/assist?do=music&ids=*', route => {
    const ids = new URL(route.request().url()).searchParams.get('ids').split(',');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        songs: ids.map((id, i) => ({ id, name: '测试歌曲 ' + (i + 1), artists: '测试歌手', album: '测试专辑', duration: 180000, url: 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3' }))
      })
    });
  });
  await page.route('**/api/assist?do=search*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, songs: [{ id: '888888', name: '搜索结果歌曲', artists: '搜索歌手', album: '搜索专辑', duration: 200000, url: 'https://music.163.com/song/media/outer/url?id=888888.mp3' }] })
  }));

  await page.goto('/music.html');
  await expect(page.locator('.track-row')).toHaveCount(71);
  await expect(page.locator('#playlistName')).toContainText('我喜欢的音乐');
  await expect(page.locator('#jcap')).toHaveCount(0);
  await expect(page.locator('#jm')).toHaveCount(0);

  const first = page.locator('.track-row').first();
  await expect(first.locator('.t b')).toContainText('花に亡霊');

  await first.locator('.rm').click();
  await expect(page.locator('.track-row')).toHaveCount(70);

  await page.locator('#addToggle').click();
  await page.locator('.add-tabs button[data-mode="id"]').click();
  await page.locator('#idInput').fill('999999');
  await page.locator('#addIdBtn').click();
  await expect(page.locator('.track-row')).toHaveCount(71);
  await expect(page.locator('#trackList')).toContainText('测试歌曲 1');

  await page.locator('.add-tabs button[data-mode="search"]').click();
  await page.locator('#searchInput').fill('测试');
  await page.locator('#searchBtn').click();
  await expect(page.locator('.search-row')).toHaveCount(1);
  await page.locator('#searchResults [data-add]').first().click();
  await expect(page.locator('.track-row')).toHaveCount(72);
});

test('shared playlist URL renders only the shared songs', async ({ page }) => {
  await page.route('**/api/assist?do=music&ids=*', route => {
    const ids = new URL(route.request().url()).searchParams.get('ids').split(',');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, songs: ids.map((id, i) => ({ id, name: '分享歌曲 ' + (i + 1), artists: '分享歌手', duration: 100000, url: 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3' })) })
    });
  });
  await page.goto('/music.html?ids=111,222');
  await expect(page.locator('.track-row')).toHaveCount(2);
  await expect(page.locator('#playlistName')).toContainText('分享歌单');
  await expect(page.locator('#trackList')).toContainText('分享歌曲 1');
});

test('music page has no horizontal overflow', async ({ page }) => {
  await page.goto('/music.html');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('3D record shelf navigates with 3D transforms', async ({ page }) => {
  await page.route(/https:\/\/p\d+\.music\.126\.net\/.*/, route => route.abort());
  await page.goto('/music.html');
  const cards = page.locator('.shelf-item');
  expect(await cards.count()).toBeGreaterThanOrEqual(5);
  const transform = await cards.first().evaluate(el => el.style.transform);
  expect(transform).toContain('translateZ');
  expect(transform).toContain('rotateY');

  const before = await page.locator('#shelfPosition').innerText();
  await page.locator('#shelfNext').click();
  await expect(page.locator('#shelfPosition')).not.toHaveText(before);
});
