// /api/post.js
// 获取单篇文章的正文内容，转换成 Markdown 返回
// 访问方式：https://你的域名/api/post?id=文章的page_id

const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// ✅ 已按你数据库截图替换成真实字段名
const FIELD = {
  title: 'title',
  date: 'date',
  category: 'category'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ ok: false, error: '缺少文章 id 参数' });
  }

  try {
    // 拿页面属性（标题、日期等元信息）
    const page = await notion.pages.retrieve({ page_id: id });
    const props = page.properties;

    // 拿正文内容，转成 Markdown
    const mdBlocks = await n2m.pageToMarkdown(id);
    const mdString = n2m.toMarkdownString(mdBlocks);

    res.status(200).json({
      ok: true,
      post: {
        id: page.id.replace(/-/g, ''),
        title: getText(props[FIELD.title]),
        date: props[FIELD.date]?.date?.start || null,
        category: props[FIELD.category]?.select?.name || null,
        markdown: mdString.parent || ''
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
