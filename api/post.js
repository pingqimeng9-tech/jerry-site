// /api/post.js — Jerry CMS 数据源：按 id 返回单篇
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'posts.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).posts||[]; }catch(e){ return []; } }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate');
  const { id } = req.query || {};
  if(!id) return res.status(400).json({ok:false,error:'缺少文章 id 参数'});
  const p = load().find(x=>x.id===id);
  if(!p) return res.status(200).json({ok:false,error:'文章不存在'});
  res.status(200).json({ok:true,post:{id:p.id,title:p.title||'',date:p.date||null,category:p.category||null,views:p.views||0,cover:p.cover||null,markdown:p.markdown||'',annotations:[]}});
};