// /api/post.js
// 数据源：仓库内置 data/posts.json（Jerry CMS 本地管理器推送上来的）
// 按 id 返回单篇文章（含 markdown 正文，post.html 用 marked 渲染）
const { posts } = require('../data/posts.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ ok: false, error: '缺少文章 id 参数' });

  const p = (posts || []).find(x => x.id === id);
  if (!p) return res.status(200).json({ ok: false, error: '文章不存在' });

  res.status(200).json({ ok: true, post: {
    id: p.id,
    title: p.title || '',
    date: p.date || null,
    category: p.category || null,
    views: p.views || 0,
    cover: p.cover || null,
    markdown: p.markdown || '',
    annotations: []
  }});
};