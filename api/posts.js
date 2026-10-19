// /api/posts.js — Jerry CMS 数据源：实时读仓库内 data/posts.json
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'site', 'data', 'posts.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).posts||[]; }catch(e){ return []; } }
function slugOf(p){ return (p.slug && String(p.slug).trim()) || String(p.id || '').split('_').pop(); }
const SITE_URL = (process.env.SITE_URL || 'https://callmiruko.cc').replace(/\/$/, '');
function xmlEsc(s){
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  try {
    const published = load().filter(p=>p.status==='published')
      .sort((a,b)=>(b.date||'').localeCompare(a.date||''))
      .map(p=>({id:p.id,slug:slugOf(p),title:p.title,date:p.date||null,category:p.category||'未分类',excerpt:p.excerpt||'',views:p.views||0,cover:p.cover||null}));
    if ((req.query || {}).format === 'rss') {
      const items = published.map(p => {
        const url = SITE_URL + '/p/' + encodeURIComponent(p.slug);
        const d = p.date ? new Date(p.date) : null;
        const pub = d && !isNaN(d.getTime()) ? '<pubDate>' + d.toUTCString() + '</pubDate>' : '';
        return '<item><title>' + xmlEsc(p.title || '无标题') + '</title><link>' + xmlEsc(url) + '</link><guid isPermaLink="true">' + xmlEsc(url) + '</guid>' +
          '<category>' + xmlEsc(p.category) + '</category><description>' + xmlEsc(p.excerpt || '') + '</description>' + pub + '</item>';
      }).join('');
      const xml = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jerry.dev</title><link>' + SITE_URL + '</link><description>Jerry 的个人博客</description><language>zh-CN</language>' + items + '</channel></rss>';
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      return res.status(200).send(xml);
    }
    res.status(200).json({ok:true,posts:published});
  } catch(err){ res.status(500).json({ok:false,error:err.message}); }
};