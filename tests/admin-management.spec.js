const { test, expect } = require('@playwright/test');

test('admin list supports quick edit and batch selection', async ({ page, request }) => {
  const created = await request.post('/api/post/save', {
    data: {
      title: 'E2E 管理页临时文章',
      category: '测试',
      excerpt: '临时数据',
      markdown: '<p>临时内容</p>',
      status: 'draft',
      date: '2026-10-19'
    }
  }).then(r => r.json());
  expect(created.ok).toBeTruthy();

  try {
    await page.goto('/admin/index.html');
    const card = page.locator('.draft-card').filter({ hasText: 'E2E 管理页临时文章' });
    await expect(card).toHaveCount(1);

    await card.getByRole('button', { name: /快速编辑/ }).click();
    await expect(page.locator('#qeMask')).toBeVisible();
    await expect(page.locator('#qeTitle')).toHaveValue('E2E 管理页临时文章');
    await page.locator('.qe-x').click();
    await expect(page.locator('#qeMask')).toBeHidden();

    await card.locator('.pick input').check();
    await expect(page.locator('#batchBar')).toBeVisible();
    await expect(page.locator('#pickCount')).toContainText('1');
    await page.getByRole('button', { name: /取消选择/ }).click();
    await expect(page.locator('#batchBar')).toBeHidden();
  } finally {
    await request.post('/api/post/delete', { data: { id: created.id } });
  }
});

test('content list supports batch selection', async ({ page, request }) => {
  const created = await request.post('/api/collection/save', {
    data: { name: 'moments', item: { text: 'E2E 内容批量临时说说', mood: '平静' } }
  }).then(r => r.json());
  expect(created.ok).toBeTruthy();

  try {
    await page.goto('/admin/content.html');
    const pick = page.locator('.c-pane.active input[data-pick]').first();
    await expect(pick).toBeVisible();
    await pick.check();
    await expect(page.locator('#contentBatch')).toBeVisible();
    await expect(page.locator('#contentPickCount')).toContainText('1');
    await page.getByRole('button', { name: /取消选择/ }).click();
    await expect(page.locator('#contentBatch')).toBeHidden();
  } finally {
    if (created.item) {
      await request.post('/api/collection/delete', { data: { name: 'moments', id: created.item.id } });
    }
  }
});
