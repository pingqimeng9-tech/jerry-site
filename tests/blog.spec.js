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
  expect(await tabs.count()).toBeGreaterThanOrEqual(7);
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
