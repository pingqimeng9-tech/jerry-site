// /api/view.js
// 数据源：仓库内置 data/posts.json（Jerry CMS 数据源）
// 说明：serverless 环境下文件只读，浏览量不自增持久化，返回当前值供展示
const { posts } = require('../data/posts.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: '只支持POST请求' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: '缺少文章 id 参数' });
  const p = (posts || []).find(x => x.id === id);
  if (!p) return res.status(200).json({ ok: false, error: '文章不存在' });
  res.status(200).json({ ok: true, views: (p.views || 0) + 1 });
};