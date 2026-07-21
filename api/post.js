// /api/post.js
// 获取单篇文章的正文内容，转换成 Markdown 返回
// 访问方式：https://你的域名/api/post?id=文章的page_id
//
// ⚠️ 这次改动前必须先在 Notion 后台确认一件事：
//   打开你的 integration 设置页 (notion.so/my-integrations -> 选中你的integration -> Capabilities)，
//   把 "Read comments" 这个权限勾上，不然下面 comments.list 的调用会直接 403。
//   如果你不勾这个，highlight+comment 那部分会静默跳过（不会导致整篇文章挂掉），
//   但也不会有任何评论数据返回。

const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// ✅ 已按你数据库截图替换成真实字段名
const FIELD = {
  title: 'title',
  date: 'date',
  category: 'category',
  views: '浏览量' // ⚠️ 需要你在Notion数据库里新建一个"数字"类型的属性，名字必须精确叫"浏览量"
};

// ================================================================
// 文件类附件（file / pdf / video / audio）：
// notion-to-md 默认转换器对这几种block的处理不太可控（有时候拿不到原始文件名，
// 有时候格式跟正文其他链接混在一起不好在前端单独识别），这里统一收窄成一种固定格式：
// 标准 markdown 链接 [文件名](url)，前端 post.html 那边是按这个格式 + 扩展名识别，
// 渲染成"下载/预览"卡片的（见 post.html 的 enhanceFileLinks()）。
// ================================================================
function extractFileInfo(fileLikeProp) {
  if (!fileLikeProp) return null;
  const url = fileLikeProp.type === 'external' ? fileLikeProp.external?.url : fileLikeProp.file?.url;
  if (!url) return null;
  return url;
}
function registerFileTransformers() {
  const fileBlockTypes = ['file', 'pdf', 'video', 'audio'];
  fileBlockTypes.forEach((type) => {
    n2m.setCustomTransformer(type, async (block) => {
      const data = block[type];
      if (!data) return false; // 拿不到就交给默认转换器兜底，不要直接吞掉这块内容
      const url = extractFileInfo(data);
      if (!url) return false;
      const caption = (data.caption || []).map((t) => t.plain_text).join('').trim();
      // 文件名优先用 caption（Notion里给文件加的说明文字），没有的话从URL里抠一个出来兜底
      let filename = caption;
      if (!filename) {
        try {
          const u = new URL(url);
          filename = decodeURIComponent(u.pathname.split('/').pop() || `${type}文件`);
        } catch (e) {
          filename = `${type}文件`;
        }
      }
      return `[${filename}](${url})`;
    });
  });
}

// ================================================================
// 高光注释（圈画高光 + 评论）：
// Notion公开API不会把"这条评论精确挂在这段富文本的哪个位置"直接给你，
// 评论是挂在"块(block)"这个粒度上的，不是挂在块内某一小段文字上的。
// 所以这里的做法是："这个块里有没有被高亮的文字" + "这个块下面有没有评论"，
// 按顺序一一配对（第1个高亮 配 第1条评论，第2个配第2条，以此类推）。
// 如果你在同一个块里高亮了好几处、又分别评论，配对顺序可能会跟你预期的对不上，
// 这是公开API本身的限制，不是bug——真要精确匹配到具体某一小段文字，Notion官方API做不到。
// ================================================================
const HIGHLIGHT_BLOCK_TYPES = [
  'paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list_item', 'numbered_list_item', 'quote', 'to_do', 'callout'
];

function getRichText(block) {
  const data = block[block.type];
  return data?.rich_text || null;
}

function findHighlightedSegments(richText) {
  if (!Array.isArray(richText)) return [];
  return richText
    .filter((t) => t.annotations?.color && /_background$/.test(t.annotations.color))
    .map((t) => ({ text: t.plain_text, color: t.annotations.color }));
}

// 递归拉取一个页面下所有的块（包括嵌套子块，比如toggle里面的内容），
// 深度限制到6层，正常文章足够用了，避免极端情况下无限递归/请求过多
async function collectAllBlocks(blockId, depth = 0, acc = []) {
  if (depth > 6) return acc;
  let cursor = undefined;
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    for (const block of res.results) {
      acc.push(block);
      if (block.has_children) {
        await collectAllBlocks(block.id, depth + 1, acc);
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return acc;
}

async function buildAnnotations(pageId) {
  const annotations = [];
  let blocks;
  try {
    blocks = await collectAllBlocks(pageId);
  } catch (err) {
    console.error('拉取块列表失败，跳过高光注释:', err.message);
    return annotations;
  }

  let annoId = 0;
  for (const block of blocks) {
    if (!HIGHLIGHT_BLOCK_TYPES.includes(block.type)) continue;
    const richText = getRichText(block);
    const highlights = findHighlightedSegments(richText);
    if (highlights.length === 0) continue;

    let comments = [];
    try {
      const commentsRes = await notion.comments.list({ block_id: block.id });
      comments = (commentsRes.results || []).map((c) => ({
        author: c.created_by?.id || '匿名',
        text: (c.rich_text || []).map((t) => t.plain_text).join(''),
        created_time: c.created_time
      }));
    } catch (err) {
      // 最常见原因：integration没开"Read comments"权限。静默跳过，不影响正文其他部分。
      continue;
    }
    if (comments.length === 0) continue;

    highlights.forEach((h, idx) => {
      annoId++;
      annotations.push({
        id: annoId,
        blockId: block.id,
        text: h.text,
        color: h.color,
        comment: comments[idx] || comments[0] || null // 按顺序配对，配不上的退回用第一条兜底
      });
    });
  }
  return annotations;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ ok: false, error: '缺少文章 id 参数' });
  }

  try {
    registerFileTransformers();

    // 拿页面属性（标题、日期等元信息）
    const page = await notion.pages.retrieve({ page_id: id });
    const props = page.properties;

    // 拿正文内容，转成 Markdown（跟之前完全一样，没有动这部分逻辑，只是多注册了上面的文件转换器）
    const mdBlocks = await n2m.pageToMarkdown(id);
    const mdString = n2m.toMarkdownString(mdBlocks);

    // 高光注释是独立拉取的，跟上面markdown转换互不影响——就算这部分失败/权限不够，
    // 也只是annotations返回空数组，文章正文该显示还是照常显示
    const annotations = await buildAnnotations(id);

    res.status(200).json({
      ok: true,
      post: {
        id: page.id.replace(/-/g, ''),
        title: getText(props[FIELD.title]),
        date: props[FIELD.date]?.date?.start || null,
        category: props[FIELD.category]?.select?.name || null,
        views: props[FIELD.views]?.number || 0,
        cover: page.cover?.external?.url || page.cover?.file?.url || null, // Notion页面自带的封面图，用作文章页背景
        markdown: mdString.parent || '',
        annotations // [{ id, blockId, text, color, comment: {author, text, created_time} }]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

function getText(prop) {
  if (!prop) return '';
  const arr = prop.title || prop.rich_text || [];
  return arr.map(t => t.plain_text).join('');
}
