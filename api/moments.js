// /api/moments.js — Jerry CMS 数据源：读取仓库内 data/moments.json（Vercel 只读）
const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'moments.json');
function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')).items||[]; }catch(e){ return []; } }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate');
  res.status(200).json({ ok:true, items: load().slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')) });
};
