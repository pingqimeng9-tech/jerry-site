// /api/comments.js — Jerry CMS 评论列表（只读，读取仓库内 data/comments.json）
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'comments.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).items||[]; }catch(e){ return []; } }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const target = (req.query && req.query.target) || '';
  const items = load()
    .filter(c => !target || c.target === target)
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  res.status(200).json({ ok:true, items });
};