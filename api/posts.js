// /api/posts.js
// 数据源：仓库内置 data/posts.json（Jerry CMS 本地管理器推送上来的）
// 已发布（status=published）的文章，按日期倒序返回精简列表
const { posts } = require('../data/posts.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  try {
    const published = (posts || [])
      .filter(p => p.status === 'published')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(p => ({
        id: p.id,
        title: p.title || '',
        date: p.date || null,
        category: p.category || '未分类',
        excerpt: p.excerpt || '',
        views: p.views || 0,
        cover: p.cover || null
      }));
    res.status(200).json({ ok: true, posts: published });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};