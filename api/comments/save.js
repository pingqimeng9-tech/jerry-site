// /api/comments/save.js — 线上评论写入（Vercel 文件系统只读，暂以 501 优雅拒绝；后续迁移 Supabase）
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method !== 'POST') return res.status(405).json({ ok:false, error:'只支持 POST' });
  res.status(501).json({ ok:false, error:'线上评论暂未开放，欢迎通过 GitHub Issue 或邮箱留言' });
};