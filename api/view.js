// /api/view.js — Jerry CMS 数据源
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'posts.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).posts||[]; }catch(e){ return []; } }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'只支持POST请求'});
  const { id } = req.body || {};
  const p = load().find(x=>x.id===id);
  if(!p) return res.status(200).json({ok:false,error:'文章不存在'});
  res.status(200).json({ok:true,views:(p.views||0)+1});
};