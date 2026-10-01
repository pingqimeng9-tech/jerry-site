// /api/post.js — Jerry CMS 数据源：按 id 或短链 slug 返回单篇
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'site', 'data', 'posts.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).posts||[]; }catch(e){ return []; } }
// 短链：优先自定义 slug，否则取文章 id 末段（最后一个 _ 后的随机码）
function slugOf(p){ return (p.slug && String(p.slug).trim()) || String(p.id || '').split('_').pop(); }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate');
  const { id, slug } = req.query || {};
  if(!id && !slug) return res.status(400).json({ok:false,error:'缺少文章 id 或 slug 参数'});
  const p = load().find(x => id ? x.id===id : (x.slug===slug || slugOf(x)===slug || x.id.endsWith('_'+slug)));
  if(!p) return res.status(200).json({ok:false,error:'文章不存在'});
  res.status(200).json({ok:true,post:{id:p.id,slug:slugOf(p),title:p.title||'',date:p.date||null,category:p.category||null,views:p.views||0,cover:p.cover||null,markdown:p.markdown||'',annotations:Array.isArray(p.annotations)?p.annotations:[]}});
};
