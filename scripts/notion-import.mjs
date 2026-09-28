// ================================================================
// Notion → 本地 Jerry CMS 全量迁移脚本（一次性）
// 用法（PowerShell）:
//   $env:NOTION_TOKEN="ntn_xxx"; $env:NOTION_DATABASE_ID="32位hex"
//   node scripts/notion-import.mjs            # 正式运行（幂等，可重复跑）
//   node scripts/notion-import.mjs --dry      # 演练，不写任何文件
//
// 做的事：
//   1. 拉取数据库全部文章（Published + Draft，Draft 存为本地草稿）
//   2. notion-to-md 转 Markdown（与旧线上同一套转换器，排版保真）
//   3. 正文图片 → images/posts/；文件附件 → files/posts/（下载卡片）
//      视频 → videos/posts/（<video>）；S3 上的 .html 演示页 → packages/（实时预览卡片）
//   4. 页面封面/封面属性 → images/posts/（视频封面转正文视频，csv 之类转附件）
//   5. 合并进 data/posts.json（按 sourceId 幂等去重，保留本地已有文章）
// 关键：Notion 托管文件 URL 常无扩展名，一律先下载再按 Content-Type 定型；
//      S3 签名链接约 1 小时过期，所有下载在转换当时即时完成。
// ================================================================
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';

const DRY = process.argv.includes('--dry');
const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, 'images/posts');
const FILE_DIR = path.join(ROOT, 'files/posts');
const VID_DIR = path.join(ROOT, 'videos/posts');
const PKG_DIR = path.join(ROOT, 'packages');
const DATA = path.join(ROOT, 'data/posts.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const stats = { posts: 0, drafts: 0, images: 0, files: 0, videos: 0, packages: 0, covers: 0, failures: [], warnings: [] };
function slugify(s) {
  return (s || 'post').toString().trim().toLowerCase()
    .replace(/[\s\u3000]+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 48) || 'post';
}
const richText = arr => (arr || []).map(t => t.plain_text).join('');
const fileUrlOf = f => !f ? null : (f.type === 'external' ? (f.external?.url || null) : (f.file?.url || null));
const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/mp4': 'm4a', 'text/plain': 'txt', 'text/csv': 'csv', 'text/html': 'html', 'application/pdf': 'pdf', 'application/zip': 'zip', 'application/x-zip-compressed': 'zip', 'application/json': 'json', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx' };
function guessExt(url, contentType = '', originalName = '') {
  const nameExt = (originalName.match(/\.([a-z0-9]{2,5})$/i) || [])[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (nameExt) return nameExt;
  const urlExt = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i) || [])[1]?.toLowerCase();
  if (urlExt) return urlExt;
  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  return MIME_EXT[ct] || 'bin';
}
function ctKind(contentType, ext) {
  const ct = (contentType || '').toLowerCase();
  ext = (ext || '').toLowerCase();
  if (ct.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv'].includes(ext)) return 'video';
  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'image';
  if (ct.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return 'audio';
  return 'file';
}
function safeName(name) {
  return (name || 'file').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';
}
function sizeText(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
function iconOfExt(ext) {
  ext = (ext || '').toLowerCase();
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  if (['exe', 'msi', 'bat', 'sh'].includes(ext)) return 'exe';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'img';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(ext)) return 'av';
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return 'av';
  if (['txt', 'md', 'log', 'rtf'].includes(ext)) return 'txt';
  return 'file';
}
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('重定向过多'));
    const req = https.get(url, { timeout: 90000, headers: { 'User-Agent': 'Mozilla/5.0 NotionMigration/1.0' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).href, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), contentType: res.headers['content-type'] || '' }));
    });
    req.on('timeout', () => req.destroy(new Error('下载超时')));
    req.on('error', reject);
  });
}
// 下载并落盘到最终位置（扩展名按 Content-Type 定型），返回 {webPath, bytes, ext, kind, base}
async function fetchAsset(url, dir, baseName, originalName = '') {
  let lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      const { buf, contentType } = await download(url);
      const ext = guessExt(url, contentType, originalName);
      const kind = ctKind(contentType, ext);
      let base = safeName(baseName);
      if (path.extname(base)) base = safeName(path.basename(base, path.extname(base)));
      let filename = `${base}.${ext}`;
      let dest = path.join(dir, filename);
      if (fs.existsSync(dest)) for (let k = 2; ; k++) { dest = path.join(dir, `${base}-${k}.${ext}`); if (!fs.existsSync(dest)) break; }
      if (!DRY) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dest, buf); }
      return { dest, webDir: '/' + path.relative(ROOT, dir).split(path.sep).join('/'), bytes: buf.length, ext, kind, filename: path.basename(dest) };
    } catch (e) { lastErr = e; await sleep(800 * i); }
  }
  throw lastErr;
}

// ---------- 每篇文章的迁移上下文 ----------
function ctxFor(page) {
  const short = page.id.replace(/-/g, '').slice(0, 8);
  let seq = 0, pkgSeq = 0;
  return {
    page, short,
    async image(url, caption = '') {
      seq++;
      const a = await fetchAsset(url, IMG_DIR, `n${short}-${seq}`);
      stats.images++;
      return `![${caption.replace(/\]/g, '＿')}](${a.webDir}/${a.filename})`;
    },
    async hostedFile(url, originalName, blockKind) {
      // 先用原始名/通用名下载，按实际类型分流到 videos 或 files
      const probeBase = originalName || `n${short}-${blockKind}`;
      const tmpDir = FILE_DIR;
      const a = await fetchAsset(url, tmpDir, probeBase.replace(/\.[a-z0-9]{2,5}$/i, ''), originalName);
      let final = a;
      if (a.kind === 'video' || blockKind === 'video') {
        if (!DRY) fs.mkdirSync(VID_DIR, { recursive: true });
        const v = await fetchAsset(url, VID_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${short}-video`, originalName);
        if (!DRY && fs.existsSync(a.dest)) fs.unlinkSync(a.dest);
        final = v; stats.videos++;
        return `\n<video controls preload="metadata" src="${v.webDir}/${v.filename}" style="width:100%;border-radius:12px"></video>\n`;
      }
      stats.files++;
      return `\n<div class="file-attach" contenteditable="false" data-href="${a.webDir}/${encodeURIComponent(a.filename)}" data-name="${a.filename.replace(/"/g, '＂')}" data-size="${sizeText(a.bytes)}" data-icon="${iconOfExt(a.ext)}"></div>\n`;
    },
    async htmlPackage(url, postTitle) {
      // 取 .html 前的对象级 UUID（Notion URL 第一段是工作区公共前缀，不能用作 id）
      const seg = url.match(/\/([0-9a-f-]{36})\/[^/]+\.html(\?|$)/i);
      let key;
      if (seg) key = seg[1].replace(/-/g, '').slice(0, 12);
      else { const h = crypto.createHash('md5').update(new URL(url).pathname).digest('hex'); key = h.slice(0, 12); }
      const id = `npkg_${key}`;
      const siteDir = path.join(PKG_DIR, id, 'site');
      const { buf } = await download(url);
      if (!DRY) {
        fs.mkdirSync(siteDir, { recursive: true });
        fs.writeFileSync(path.join(siteDir, 'index.html'), buf);
        const html = buf.toString('utf8');
        const rel = [...html.matchAll(/(?:src|href)\s*=\s*"(?!https?:|data:|\/\/|#|\/)([^"]+)"/g)].map(x => x[1]);
        if (rel.length) stats.warnings.push(`[${postTitle}] 演示包 ${id} 含相对路径资源 ${rel.length} 个: ${[...new Set(rel)].slice(0, 5).join(', ')}（可能需补资源）`);
        fs.writeFileSync(path.join(PKG_DIR, id, 'meta.json'), JSON.stringify({
          name: postTitle.slice(0, 60), entry: `/packages/${id}/site/index.html`, zip: '', kind: 'html', date: now()
        }, null, 2), 'utf8');
      }
      stats.packages++;
      pkgSeq++;
      const display = pkgSeq > 1 ? `${postTitle} · 演示${pkgSeq}` : postTitle;
      return `\n<div class="site-preview" contenteditable="false" data-src="/packages/${id}/site/index.html" data-zip="" data-name="${display.replace(/"/g, '＂')}" data-w="72%"></div>\n`;
    }
  };
}

let CUR = null;
// Notion 文字色板（前景为官方浅色主题文字色，背景沿用旧站 NOTION_COLOR_MAP）
const FG_COLOR = { gray: '#787774', brown: '#9f6b53', orange: '#d9730d', yellow: '#cb912f', green: '#448361', blue: '#337ea9', purple: '#9065b0', pink: '#c14c8a', red: '#eb5757' };
const BG_COLOR = { yellow_background: '#F5E0A3', red_background: '#F5A9A3', blue_background: '#A3C9F5', green_background: '#A9E0BA', gray_background: '#D4D4D4', purple_background: '#D3B8F0', pink_background: '#F5B8DE', orange_background: '#F5C79E', brown_background: '#D2B48C' };
// 富文本数组 → markdown（复刻 n2m default 分支，并补颜色；行内公式）
function richToMd(arr) {
  return (arr || []).map(c => {
    let t;
    if (c.type === 'equation') t = '$' + c.equation.expression + '$';
    else t = n2m.annotatePlainText(c.plain_text, c.annotations);
    if (c.href) t = `[${t}](${c.href})`;
    return t;
  }).join('');
}
function registerTransformers() {
  // monkey-patch：n2m 默认丢弃文字颜色/背景高亮，这里补上（所有富文本块都走该函数，零侵入）
  const origAnnotate = n2m.annotatePlainText.bind(n2m);
  n2m.annotatePlainText = function (text, ann) {
    let out = origAnnotate(text, ann);
    const color = ann?.color;
    if (color && color !== 'default' && text && text.trim()) {
      if (BG_COLOR[color]) out = `<mark style="background-color:${BG_COLOR[color]};color:#1f1f1f;border-radius:3px;padding:0 3px">${out}</mark>`;
      else if (FG_COLOR[color]) out = `<span style="color:${FG_COLOR[color]}">${out}</span>`;
    }
    return out;
  };
  // Notion 有四级标题，n2m 默认不识别会降级成纯文本
  n2m.setCustomTransformer('heading_4', async block => `#### ${richToMd(block.heading_4?.rich_text)}`);
  n2m.setCustomTransformer('image', async block => {
    const d = block.image;
    if (!d) return false;
    if (d.type === 'external') return `![${richText(d.caption)}](${d.external.url})`;
    try { return await CUR.image(d.file.url, richText(d.caption)); }
    catch (e) { stats.failures.push(`[${CUR.title}] 图片下载失败: ${e.message}`); return `![${richText(d.caption)}](${d.file.url})`; }
  });
  for (const kind of ['file', 'pdf', 'video', 'audio']) {
    n2m.setCustomTransformer(kind, async block => {
      const d = block[kind];
      if (!d) return false;
      const url = fileUrlOf(d);
      if (!url) return false;
      if (d.type === 'external') return `[${richText(d.caption) || '外部文件'}](${url})`;
      const name = d.name || richText(d.caption) || '';
      try { return await CUR.hostedFile(url, name, kind); }
      catch (e) { stats.failures.push(`[${CUR.title}] 附件(${kind})下载失败: ${e.message}`); return `[${name || '文件'}](${url})`; }
    });
  }
  n2m.setCustomTransformer('embed', async block => {
    const url = block.embed?.url || '';
    if (/\.html(\?|$)/i.test(url) && /(s3\.|notionstatic|notion\.so)/i.test(url)) {
      try { return await CUR.htmlPackage(url, CUR.title); }
      catch (e) { stats.failures.push(`[${CUR.title}] HTML演示页下载失败: ${e.message}`); return `[🔗 演示页面](${url})`; }
    }
    return false;
  });
}

// ---------- 封面 / 属性文件（下载后按 Content-Type 分流）----------
async function handleCoverAndProps(page, markdown) {
  let coverWeb = '';
  const prepend = [], append = [];
  const placeAsset = async (url, originalName, { fromProp = false } = {}) => {
    // 属性里的图片且还没有封面 → 作封面；视频 → 正文顶部；其他 → 末尾附件
    const a = await fetchAsset(url, FILE_DIR, (originalName || `n${CUR.short}-asset`).replace(/\.[a-z0-9]{2,5}$/i, ''), originalName);
    if (a.kind === 'image') {
      if (!coverWeb) {
        // 挪到 images 目录
        const img = await fetchAsset(url, IMG_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${CUR.short}-cover`, originalName);
        if (!DRY && fs.existsSync(a.dest) && a.dest !== img.dest) fs.unlinkSync(a.dest);
        stats.covers++; coverWeb = `${img.webDir}/${img.filename}`;
      } else {
        stats.images++;
        return `\n![${originalName || ''}](${a.webDir}/${a.filename})\n`;
      }
    } else if (a.kind === 'video') {
      const v = await fetchAsset(url, VID_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${CUR.short}-cover`, originalName);
      if (!DRY && fs.existsSync(a.dest)) fs.unlinkSync(a.dest);
      stats.videos++;
      stats.warnings.push(`[${CUR.title}] 封面是视频，已转为正文顶部视频`);
      prepend.push(`<video controls preload="metadata" src="${v.webDir}/${v.filename}" style="width:100%;border-radius:12px"></video>`);
    } else {
      stats.files++;
      append.push(`<div class="file-attach" contenteditable="false" data-href="${a.webDir}/${encodeURIComponent(a.filename)}" data-name="${a.filename.replace(/"/g, '＂')}" data-size="${sizeText(a.bytes)}" data-icon="${iconOfExt(a.ext)}"></div>`);
    }
    return '';
  };

  if (page.cover) {
    const url = fileUrlOf(page.cover);
    if (url) {
      if (page.cover.type === 'external') coverWeb = url;
      else {
        try { await placeAsset(url, '', {}); }
        catch (e) { stats.failures.push(`[${CUR.title}] 页面封面下载失败: ${e.message}`); }
      }
    }
  }
  for (const f of page.properties?.['Files & media']?.files || []) {
    const url = fileUrlOf(f);
    if (!url) continue;
    if (f.type === 'external') { if (!coverWeb) coverWeb = url; continue; }
    try { await placeAsset(url, f.name || '', { fromProp: true }); }
    catch (e) { stats.failures.push(`[${CUR.title}] 封面属性文件下载失败(${f.name}): ${e.message}`); }
  }
  let md = markdown;
  if (prepend.length) md = prepend.join('\n\n') + '\n\n' + md;
  if (append.length) md = md.trimEnd() + '\n\n' + append.join('\n\n') + '\n';
  return { coverWeb, markdown: md };
}

// ---------- 主流程 ----------
registerTransformers();
for (const d of [IMG_DIR, FILE_DIR, VID_DIR, PKG_DIR]) if (!DRY) fs.mkdirSync(d, { recursive: true });

const db = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
const dsId = db.data_sources?.[0]?.id;
if (!dsId) throw new Error('数据库下没有 data source');
const pages = [];
let cursor;
do {
  const r = await notion.dataSources.query({ data_source_id: dsId, start_cursor: cursor, page_size: 100 });
  pages.push(...r.results);
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);
console.log(`数据库共 ${pages.length} 行，开始迁移...`);

const imported = [];
for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  const title = richText(page.properties?.title?.title) || '(无标题)';
  const statusRaw = page.properties?.status?.select?.name || page.properties?.status?.status?.name || '';
  const statusName = statusRaw === 'Draft' ? 'draft' : 'published';
  CUR = { ...ctxFor(page), title };
  process.stdout.write(`\r[${i + 1}/${pages.length}] ${title.slice(0, 30)}`);
  try {
    await sleep(180);
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    let markdown = n2m.toMarkdownString(mdBlocks).parent || '';
    const { coverWeb, markdown: md2 } = await handleCoverAndProps(page, markdown);
    markdown = md2;

    const category = page.properties?.category?.select?.name || '未分类';
    let excerpt = richText(page.properties?.summary?.rich_text);
    if (!excerpt) excerpt = markdown.replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/[#>*`\[\]()_-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    const date = page.properties?.date?.date?.start?.slice(0, 10) || page.created_time.slice(0, 10);
    const id = `${slugify(title).slice(0, 40)}-${page.id.replace(/-/g, '').slice(0, 8)}`;

    imported.push({
      id, sourceId: 'notion:' + page.id, title, category, excerpt,
      cover: coverWeb || '', thumb: '', tags: [], mood: '',
      views: page.properties?.['浏览量']?.number || 0,
      date, status: statusName, markdown: markdown.trim() + '\n',
      createdAt: page.created_time.replace('T', ' ').slice(0, 19),
      updatedAt: page.last_edited_time.replace('T', ' ').slice(0, 19),
      syncedAt: null
    });
    if (statusName === 'draft') stats.drafts++; else stats.posts++;
  } catch (e) {
    stats.failures.push(`[${title}] 整篇失败: ${e.message}`);
  }
}
process.stdout.write('\n');

if (!DRY) {
  if (!fs.existsSync(DATA)) throw new Error('data/posts.json 不存在');
  const backup = DATA + '.bak-notion-' + Date.now();
  fs.copyFileSync(DATA, backup);
  const dbj = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const local = (dbj.posts || []).filter(p => !imported.some(q => q.sourceId === p.sourceId));
  const merged = [...imported, ...local].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  dbj.posts = merged;
  fs.writeFileSync(DATA, JSON.stringify(dbj, null, 2), 'utf8');
  console.log(`已备份原文件 -> ${path.basename(backup)}`);
  console.log(`posts.json: 迁入 ${imported.length} 篇（${stats.posts} 发布 + ${stats.drafts} 草稿），保留本地 ${local.length} 篇，共 ${merged.length} 篇`);
} else {
  console.log(`[DRY] 将迁入 ${imported.length} 篇（${stats.posts} 发布 + ${stats.drafts} 草稿）`);
}
console.log(`素材: 图片 ${stats.images} | 附件 ${stats.files} | 视频 ${stats.videos} | HTML演示包 ${stats.packages} | 封面图 ${stats.covers}`);
if (stats.warnings.length) { console.log('\n--- 警告 ---'); [...new Set(stats.warnings)].forEach(w => console.log('  ⚠ ' + w)); }
if (stats.failures.length) { console.log('\n--- 失败清单 ---'); stats.failures.forEach(f => console.log('  ✗ ' + f)); }
fs.writeFileSync(path.join(ROOT, 'data/notion-import-report.json'), JSON.stringify({ time: now(), DRY, ...stats, imported: imported.map(p => ({ id: p.id, title: p.title, date: p.date, status: p.status, cover: p.cover, len: p.markdown.length })) }, null, 2), 'utf8');
console.log('\n报告已写 data/notion-import-report.json');
