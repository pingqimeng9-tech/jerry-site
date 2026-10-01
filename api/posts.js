// /api/posts.js — Jerry CMS 数据源：实时读仓库内 data/posts.json
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'site', 'data', 'posts.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).posts||[]; }catch(e){ return []; } }
function slugOf(p){ return (p.slug && String(p.slug).trim()) || String(p.id || '').split('_').pop(); }
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  try {
    const published = load().filter(p=>p.status==='published')
      .sort((a,b)=>(b.date||'').localeCompare(a.date||''))
      .map(p=>({id:p.id,slug:slugOf(p),title:p.title,date:p.date||null,category:p.category||'未分类',excerpt:p.excerpt||'',views:p.views||0,cover:p.cover||null}));
    res.status(200).json({ok:true,posts:published});
  } catch(err){ res.status(500).json({ok:false,error:err.message}); }
};