// /api/view.js
// 文章浏览量+1，返回自增后的最新数值
// 调用方式：POST https://你的域名/api/view  body: { id: "文章的page_id" }
//
// ⚠️ 注意事项：
// 1. Notion API 没有"原子自增"操作，这里是"先读当前值，再写回值+1"，
//    极小概率下如果同一篇文章被两个人在同一毫秒内同时打开，可能会漏计一次。
//    对个人博客的真实访问量级来说完全可以接受，不用当bug看。
// 2. 需要在Notion数据库里新建一个"数字"类型的属性，名字必须精确叫"浏览量"

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const VIEWS_FIELD = '浏览量';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: '只支持POST请求' });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ ok: false, error: '缺少文章 id 参数' });
  }

  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const current = page.properties[VIEWS_FIELD]?.number || 0;
    const next = current + 1;

    await notion.pages.update({
      page_id: id,
      properties: {
        [VIEWS_FIELD]: { number: next }
      }
    });

    res.status(200).json({ ok: true, views: next });
  } catch (err) {
    console.error(err);
    // 浏览量统计失败不应该影响文章正常显示，前端会静默忽略这个错误
    res.status(500).json({ ok: false, error: err.message });
  }
};
