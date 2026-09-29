// ================================================================
// Notion → 本地 Jerry CMS 增量同步模块
// CLI:
//   node scripts/notion-sync.mjs --mode=preview   # 只预览新增/改动（不拉正文、不下载）
//   node scripts/notion-sync.mjs --mode=sync      # 正式同步（幂等，可重复跑）
// 配置优先级：环境变量 NOTION_TOKEN / NOTION_DATABASE_ID > data/notion_config.json
// 结果：进度日志走 stderr；最终报告以单行 JSON 打到 stdout（前缀 __NOTION_SYNC_RESULT__）
// ================================================================
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'site');
const IMG_DIR = path.join(ROOT, 'images/posts');
const FILE_DIR = path.join(ROOT, 'files/posts');
const VID_DIR = path.join(ROOT, 'videos/posts');
const PKG_DIR = path.join(ROOT, 'packages');
const DATA = path.join(ROOT, 'data/posts.json');
const CFG_FILE = path.join(ROOT, 'data/notion_config.json');
const REPORT_FILE = path.join(ROOT, 'data/notion-sync-report.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const log = (...a) => console.error('[notion-sync]', ...a);

function slugify(s) {
  return (s || 'post').toString().trim().toLowerCase()
    .replace(/[\s　]+/g, '-').replace(/[^\w一-龥-]/g, '').replace(/-+/g, '-')
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
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return 'av';
  if (['txt', 'md', 'log', 'rtf'].includes(ext)) return 'txt';
  return 'file';
}
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('重定向过多'));
    const req = https.get(url, { timeout: 90000, headers: { 'User-Agent': 'Mozilla/5.0 NotionSync/1.0' } }, res => {
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

// ---------- 主同步 ----------
export async function syncFromNotion(opts = {}) {
  const mode = opts.mode === 'sync' ? 'sync' : 'preview';
  const dry = mode === 'preview';
  const token = opts.token || process.env.NOTION_TOKEN || '';
  const databaseId = opts.databaseId || process.env.NOTION_DATABASE_ID || '';
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};
  if (!token) throw new Error('缺少 Notion Token');
  if (!databaseId) throw new Error('缺少 Notion Database ID');
  // 兼容无横线的 32 位 hex（从公开分享链接复制的形式）→ 标准 UUID
  const dbIdNorm = /^[0-9a-f]{32}$/i.test(databaseId.trim())
    ? databaseId.trim().replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
    : databaseId.trim();

  const stats = { posts: 0, drafts: 0, images: 0, files: 0, videos: 0, packages: 0, covers: 0, failures: [], warnings: [] };
  const notion = new Client({ auth: token });
  const n2m = new NotionToMarkdown({ notionClient: notion });

  // ---------- 素材下载（dry 不落盘） ----------
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
        if (!dry) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dest, buf); }
        return { dest, webDir: '/' + path.relative(ROOT, dir).split(path.sep).join('/'), bytes: buf.length, ext, kind, filename: path.basename(dest) };
      } catch (e) { lastErr = e; await sleep(800 * i); }
    }
    throw lastErr;
  }

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
        const a = await fetchAsset(url, FILE_DIR, (originalName || `n${short}-${blockKind}`).replace(/\.[a-z0-9]{2,5}$/i, ''), originalName);
        if (a.kind === 'video' || blockKind === 'video') {
          const v = await fetchAsset(url, VID_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${short}-video`, originalName);
          if (!dry && fs.existsSync(a.dest)) fs.unlinkSync(a.dest);
          stats.videos++;
          return `\n<video controls preload="metadata" src="${v.webDir}/${v.filename}" style="width:100%;border-radius:12px"></video>\n`;
        }
        stats.files++;
        return `\n<div class="file-attach" contenteditable="false" data-href="${a.webDir}/${encodeURIComponent(a.filename)}" data-name="${a.filename.replace(/"/g, '＂')}" data-size="${sizeText(a.bytes)}" data-icon="${iconOfExt(a.ext)}"></div>\n`;
      },
      async htmlPackage(url, postTitle) {
        const seg = url.match(/\/([0-9a-f-]{36})\/[^/]+\.html(\?|$)/i);
        let key;
        if (seg) key = seg[1].replace(/-/g, '').slice(0, 12);
        else { const h = crypto.createHash('md5').update(new URL(url).pathname).digest('hex'); key = h.slice(0, 12); }
        const id = `npkg_${key}`;
        const siteDir = path.join(PKG_DIR, id, 'site');
        const { buf } = await download(url);
        if (!dry) {
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
  const FG_COLOR = { gray: '#787774', brown: '#9f6b53', orange: '#d9730d', yellow: '#cb912f', green: '#448361', blue: '#337ea9', purple: '#9065b0', pink: '#c14c8a', red: '#eb5757' };
  const BG_COLOR = { yellow_background: '#F5E0A3', red_background: '#F5A9A3', blue_background: '#A3C9F5', green_background: '#A9E0BA', gray_background: '#D4D4D4', purple_background: '#D3B8F0', pink_background: '#F5B8DE', orange_background: '#F5C79E', brown_background: '#D2B48C' };
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

  async function handleCoverAndProps(page, markdown) {
    let coverWeb = '';
    const prepend = [], append = [];
    const placeAsset = async (url, originalName) => {
      const a = await fetchAsset(url, FILE_DIR, (originalName || `n${CUR.short}-asset`).replace(/\.[a-z0-9]{2,5}$/i, ''), originalName);
      if (a.kind === 'image') {
        if (!coverWeb) {
          const img = await fetchAsset(url, IMG_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${CUR.short}-cover`, originalName);
          if (!dry && fs.existsSync(a.dest) && a.dest !== img.dest) fs.unlinkSync(a.dest);
          stats.covers++; coverWeb = `${img.webDir}/${img.filename}`;
        } else {
          stats.images++;
          return `\n![${originalName || ''}](${a.webDir}/${a.filename})\n`;
        }
      } else if (a.kind === 'video') {
        const v = await fetchAsset(url, VID_DIR, originalName ? originalName.replace(/\.[a-z0-9]{2,5}$/i, '') : `n${CUR.short}-cover`, originalName);
        if (!dry && fs.existsSync(a.dest)) fs.unlinkSync(a.dest);
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
        else { try { await placeAsset(url, ''); } catch (e) { stats.failures.push(`[${CUR.title}] 页面封面下载失败: ${e.message}`); } }
      }
    }
    for (const f of page.properties?.['Files & media']?.files || []) {
      const url = fileUrlOf(f);
      if (!url) continue;
      if (f.type === 'external') { if (!coverWeb) coverWeb = url; continue; }
      try { await placeAsset(url, f.name || ''); }
      catch (e) { stats.failures.push(`[${CUR.title}] 封面属性文件下载失败(${f.name}): ${e.message}`); }
    }
    let md = markdown;
    if (prepend.length) md = prepend.join('\n\n') + '\n\n' + md;
    if (append.length) md = md.trimEnd() + '\n\n' + append.join('\n\n') + '\n';
    return { coverWeb, markdown: md };
  }

  // ---------- 1. 拉数据库行 ----------
  onProgress({ phase: 'query', message: '正在连接 Notion 数据库…' });
  // 输入可能是 database id（32hex 或 UUID），也可能直接是 data_source id（v5）
  let dsId, dbTitle = '';
  try {
    const db = await notion.databases.retrieve({ database_id: dbIdNorm });
    dsId = db.data_sources?.[0]?.id;
    dbTitle = richText(db.title);
  } catch (eDb) {
    try {
      const ds = await notion.dataSources.retrieve({ data_source_id: dbIdNorm });
      dsId = ds.id;
      dbTitle = richText(ds.title) || '(data source)';
    } catch (eDs) {
      throw new Error('数据库 ID 无效或 Integration 未被授权访问（请确认复制的是分享链接中 32 位 ID，且已在 Notion 里 Connect 该 Integration）：' + eDb.message);
    }
  }
  if (!dsId) throw new Error('数据库下没有 data source');
  const pages = [];
  let cursor;
  do {
    const r = await notion.dataSources.query({ data_source_id: dsId, start_cursor: cursor, page_size: 100 });
    pages.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  log(`数据库共 ${pages.length} 行`);

  // ---------- 2. 与本地比对（元数据级） ----------
  const localStore = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : { posts: [] };
  const localBySource = new Map((localStore.posts || []).filter(p => p.sourceId).map(p => [p.sourceId, p]));

  const metaOf = page => {
    const title = richText(page.properties?.title?.title) || '(无标题)';
    const statusRaw = page.properties?.status?.select?.name || page.properties?.status?.status?.name || '';
    return {
      sourceId: 'notion:' + page.id,
      pageId: page.id,
      title,
      status: statusRaw === 'Draft' ? 'draft' : 'published',
      category: page.properties?.category?.select?.name || '未分类',
      excerpt: richText(page.properties?.summary?.rich_text),
      date: page.properties?.date?.date?.start?.slice(0, 10) || page.created_time.slice(0, 10),
      notionEditedAt: page.last_edited_time.replace('T', ' ').slice(0, 19),
      createdAt: page.created_time.replace('T', ' ').slice(0, 19)
    };
  };

  const added = [], updated = [], unchanged = [];
  for (const page of pages) {
    const m = metaOf(page);
    const old = localBySource.get(m.sourceId);
    if (!old) { added.push(m); continue; }
    // 旧迁移数据没有 notionEditedAt 字段，updatedAt 当时存的就是 Notion 编辑时间，作为回退
    const oldEdited = old.notionEditedAt || (old.sourceId ? old.updatedAt : '');
    if (oldEdited === m.notionEditedAt) { unchanged.push(m); continue; }
    // 属性级变化明细
    const changes = [];
    if (old.title !== m.title) changes.push({ field: '标题', from: old.title, to: m.title });
    if ((old.status || 'published') !== m.status) changes.push({ field: '状态', from: old.status, to: m.status });
    if ((old.category || '') !== m.category) changes.push({ field: '分类', from: old.category || '', to: m.category });
    if ((old.date || '') !== m.date) changes.push({ field: '日期', from: old.date || '', to: m.date });
    if ((old.excerpt || '') !== m.excerpt) changes.push({ field: '摘要', from: old.excerpt || '', to: m.excerpt || '' });
    updated.push({ ...m, changes, bodyChanged: true }); // 正文是否变化需转换后才知道，先标记
  }

  if (dry) {
    const result = {
      ok: true, mode: 'preview', time: now(), total: pages.length,
      added: added.map(m => ({ title: m.title, status: m.status, category: m.category, date: m.date })),
      updated: updated.map(m => ({ title: m.title, status: m.status, category: m.category, date: m.date, changes: m.changes })),
      unchangedCount: unchanged.length,
      message: `检测到 ${added.length} 篇新增、${updated.length} 篇有修改、${unchanged.length} 篇未变`
    };
    fs.writeFileSync(REPORT_FILE, JSON.stringify(result, null, 2), 'utf8');
    return result;
  }

  // ---------- 3. 正式同步：只转换 新增+修改 ----------
  registerTransformers();
  for (const d of [IMG_DIR, FILE_DIR, VID_DIR, PKG_DIR]) fs.mkdirSync(d, { recursive: true });

  const targets = [...added, ...updated];
  const imported = [];
  const stats0 = { images: 0, files: 0, videos: 0, packages: 0, covers: 0 };
  for (let i = 0; i < targets.length; i++) {
    const m = targets[i];
    const page = pages.find(p => p.id === m.pageId);
    CUR = { ...ctxFor(page), title: m.title };
    onProgress({ phase: 'convert', index: i + 1, total: targets.length, message: `[${i + 1}/${targets.length}] ${m.title}` });
    log(`[${i + 1}/${targets.length}] ${m.title}`);
    try {
      await sleep(180);
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      let markdown = n2m.toMarkdownString(mdBlocks).parent || '';
      const { coverWeb, markdown: md2 } = await handleCoverAndProps(page, markdown);
      markdown = md2;
      let excerpt = m.excerpt;
      if (!excerpt) excerpt = markdown.replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/[#>*`\[\]()_-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

      const old = localBySource.get(m.sourceId);
      const id = old?.id || `${slugify(m.title).slice(0, 40)}-${m.pageId.replace(/-/g, '').slice(0, 8)}`;
      imported.push({
        id, sourceId: m.sourceId, title: m.title, category: m.category, excerpt,
        cover: coverWeb || old?.cover || '', thumb: old?.thumb || '', tags: old?.tags || [], mood: old?.mood || '',
        views: old?.views || 0,
        date: m.date, status: m.status, markdown: markdown.trim() + '\n',
        createdAt: old?.createdAt || m.createdAt,
        updatedAt: m.notionEditedAt, notionEditedAt: m.notionEditedAt,
        syncedAt: null
      });
      if (m.status === 'draft') stats.drafts++; else stats.posts++;
    } catch (e) {
      stats.failures.push(`[${m.title}] 整篇失败: ${e.message}`);
    }
  }

  // ---------- 4. 合并写盘 ----------
  if (!imported.length) {
    const result0 = {
      ok: true, mode: 'sync', time: now(), total: pages.length,
      synced: 0, addedCount: 0, updatedCount: 0, unchangedCount: unchanged.length,
      keptLocal: (localStore.posts || []).filter(p => !p.sourceId).length,
      totalPosts: (localStore.posts || []).length,
      stats: { posts: 0, drafts: 0, images: 0, files: 0, videos: 0, packages: 0, covers: 0 },
      added: [], updated: [], failures: [], warnings: [], backup: '', noChanges: true
    };
    fs.writeFileSync(REPORT_FILE, JSON.stringify(result0, null, 2), 'utf8');
    log('没有新增或修改，跳过写盘');
    return result0;
  }
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  const backup = DATA + '.bak-notion-' + Date.now();
  fs.copyFileSync(DATA, backup);
  const incomingIds = new Set(imported.map(p => p.sourceId));
  // 未变化的 Notion 文章 + 本地文章原样保留；被同步的文章用新版本替换
  const kept = (localStore.posts || []).filter(p => !incomingIds.has(p.sourceId));
  const merged = [...imported, ...kept].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  localStore.posts = merged;
  fs.writeFileSync(DATA, JSON.stringify(localStore, null, 2), 'utf8');

  // 正文是否真的变化（与旧版本比 markdown）
  const updatedDetail = updated.map(m => {
    const old = localBySource.get(m.sourceId);
    const fresh = imported.find(p => p.sourceId === m.sourceId);
    return {
      title: m.title, status: m.status, category: m.category, date: m.date, changes: m.changes,
      bodyChanged: fresh ? (old?.markdown || '') !== fresh.markdown : false
    };
  });

  const result = {
    ok: stats.failures.length === 0, mode: 'sync', time: now(),
    total: pages.length,
    synced: imported.length, addedCount: added.length, updatedCount: updated.length, unchangedCount: unchanged.length,
    keptLocal: kept.filter(p => !p.sourceId).length,
    totalPosts: merged.length,
    stats: { posts: stats.posts, drafts: stats.drafts, images: stats.images, files: stats.files, videos: stats.videos, packages: stats.packages, covers: stats.covers },
    added: added.map(m => m.title),
    updated: updatedDetail,
    failures: stats.failures,
    warnings: [...new Set(stats.warnings)],
    backup: path.basename(backup)
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(result, null, 2), 'utf8');
  log(`同步 ${imported.length} 篇，素材 图${stats.images}/附件${stats.files}/视频${stats.videos}/包${stats.packages}/封面${stats.covers}，失败 ${stats.failures.length}`);
  return result;
}

// ---------- CLI ----------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const mode = process.argv.includes('--mode=sync') ? 'sync' : 'preview';
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8').replace(/^﻿/, '')); } catch (e) {}
  syncFromNotion({
    mode,
    token: process.env.NOTION_TOKEN || cfg.token,
    databaseId: process.env.NOTION_DATABASE_ID || cfg.databaseId,
    onProgress: p => console.error(p.message || p.phase)
  }).then(r => {
    console.log('__NOTION_SYNC_RESULT__' + JSON.stringify(r));
    process.exit(r.ok === false ? 1 : 0);
  }).catch(e => {
    console.log('__NOTION_SYNC_RESULT__' + JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  });
}
