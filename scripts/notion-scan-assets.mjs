// Notion 迁移 - 全量素材扫描（只读）：统计每篇文章的 block 类型、图片/附件/嵌入/封面
import { Client } from '@notionhq/client';
import fs from 'node:fs';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB = process.env.NOTION_DATABASE_ID;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function allBlocks(blockId, acc = [], depth = 0) {
  if (depth > 8) return acc;
  let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    for (const b of r.results) {
      acc.push(b);
      if (b.has_children) { await sleep(120); await allBlocks(b.id, acc, depth + 1); }
    }
    cursor = r.has_more ? r.next_cursor : undefined;
    if (cursor) await sleep(120);
  } while (cursor);
  return acc;
}
const fileUrl = f => f?.type === 'external' ? (f.external?.url || '') : (f.file?.url || '');
const ext = u => { try { return new URL(u).pathname.split('.').pop().toLowerCase().split('?')[0]; } catch { return '?'; } };

const db = await notion.databases.retrieve({ database_id: DB });
const dsId = db.data_sources?.[0]?.id;
const pages = [];
let cursor;
do {
  const r = await notion.dataSources.query({ data_source_id: dsId, start_cursor: cursor, page_size: 100 });
  pages.push(...r.results);
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);

const typeCount = {};
const report = [];
let totalImg = 0, totalFiles = 0, totalEmbeds = 0, totalCovers = 0;
const fileExts = {};

for (let i = 0; i < pages.length; i++) {
  const p = pages[i];
  const title = (p.properties?.title?.title || []).map(t => t.plain_text).join('') || '(无标题)';
  const status = p.properties?.status?.status?.name || '';
  await sleep(200);
  let blocks = [];
  try { blocks = await allBlocks(p.id); } catch (e) { report.push({ title, error: e.message }); continue; }
  const local = { title, status, blocks: blocks.length, images: 0, files: 0, embeds: 0, fileList: [], embedList: [] };
  for (const b of blocks) {
    typeCount[b.type] = (typeCount[b.type] || 0) + 1;
    if (b.type === 'image') {
      local.images++; totalImg++;
    } else if (['file', 'pdf', 'video', 'audio'].includes(b.type)) {
      const u = fileUrl(b[b.type]);
      local.files++; totalFiles++;
      if (u) { const e = ext(u); fileExts[e] = (fileExts[e] || 0) + 1; local.fileList.push(`${b.type}:${e}`); }
    } else if (b.type === 'embed') {
      local.embeds++; totalEmbeds++;
      local.embedList.push(b.embed?.url || '');
    } else if (b.type === 'bookmark') {
      typeCount['bookmark'] = typeCount['bookmark'] || 0;
    }
  }
  const coverProp = p.properties?.['Files & media']?.files?.[0];
  const coverUrl = coverProp ? (coverProp.external?.url || coverProp.file?.url || '') : (p.cover ? (p.cover.external?.url || p.cover.file?.url || '') : '');
  if (coverUrl) { local.cover = ext(coverUrl); totalCovers++; }
  if (local.images || local.files || local.embeds || local.cover) report.push(local);
  process.stdout.write(`\r扫描 ${i + 1}/${pages.length}`);
}
console.log('\n\n=== block 类型分布 ===');
console.log(JSON.stringify(typeCount, null, 1));
console.log(`\n=== 汇总 === 图片块 ${totalImg} | 附件块 ${totalFiles} | embed ${totalEmbeds} | 封面 ${totalCovers}`);
console.log('附件扩展名分布:', JSON.stringify(fileExts));
console.log('\n=== 含素材的文章 ===');
report.forEach(r => console.log(`- [${r.status}] ${r.title.slice(0, 40)} | 图${r.images} 附件${r.files} embed${r.embeds} 封面${r.cover || '无'}${r.fileList.length ? ' | 文件:' + r.fileList.join(',') : ''}${r.embedList.length ? ' | embed:' + r.embedList.slice(0, 3).join(' , ') : ''}`));
fs.writeFileSync(process.env.TEMP + '\\cms-shot\\notion-asset-scan.json', JSON.stringify({ typeCount, report, totalImg, totalFiles, totalEmbeds, totalCovers, fileExts }, null, 2), 'utf8');
