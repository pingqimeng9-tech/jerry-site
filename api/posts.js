// /api/posts.js
// 获取 Notion 数据库里所有「已发布」的文章，返回精简 JSON 列表
// 部署在 Vercel 后，访问 https://你的域名/api/posts 即可看到返回结果

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// data_source_id 基本不会变，简单内存缓存一下，减少一次多余的 API 调用
// （注意：Serverless Function 冷启动时这个缓存会失效，属于正常现象）
let cachedDataSourceId = null;
async function getDataSourceId() {
  if (cachedDataSourceId) return cachedDataSourceId;
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const dataSourceId = db.data_sources?.[0]?.id;
  if (!dataSourceId) {
    throw new Error('这个数据库下没有找到任何 data source，请确认 DATABASE_ID 填对了');
  }
  cachedDataSourceId = dataSourceId;
  return dataSourceId;
}

// ✅ 字段已按最新数据库截图更新：type/status/title/summary/category/date/Files & media
// 注意：tags 字段已被删除，不再读取
const FIELD = {
  title: 'title',
  status: 'status',
  statusValue: 'Published',
  type: 'type',
  typeValue: 'Post',
  date: 'date',
  category: 'category',
  excerpt: 'summary',
  cover: 'Files & media',   // 文件类型属性，用来当文章封面图（如果这一行没传文件，会自动回退成空）
  views: '浏览量'           // 数字类型属性，供侧边栏统计"全站总浏览量"用
};

module.exports = async (req, res) => {
  // 允许你自己的前端跨域调用（同域其实不需要，先加上保险）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // 缓存60秒，减轻Notion API压力

  try {
    // Notion 在 2025-09-03 版本 API 里把「数据库」和「数据源」拆成了两层
    // 必须先用 database_id 查出它底下的 data_source_id，才能真正查询里面的文章行
    const dataSourceId = await getDataSourceId();

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          { property: FIELD.status, select: { equals: FIELD.statusValue } },
          { property: FIELD.type, select: { equals: FIELD.typeValue } }
        ]
      },
      sorts: [{ property: FIELD.date, direction: 'descending' }]
    });

    const posts = response.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id.replace(/-/g, ''),
        title: getText(props[FIELD.title]),
        date: props[FIELD.date]?.date?.start || null,
        category: props[FIELD.category]?.select?.name || null,
        excerpt: getText(props[FIELD.excerpt]) || '',
        views: props[FIELD.views]?.number || 0,
        cover: getFileUrl(props[FIELD.cover]) || page.cover?.external?.url || page.cover?.file?.url || null
      };
    });

    res.status(200).json({ ok: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Notion 的标题/富文本字段结构比较绕，抽个小工具函数统一处理
function getText(prop) {
  if (!prop) return '';
  const arr = prop.title || prop.rich_text || [];
  return arr.map(t => t.plain_text).join('');
}

// "Files & media" 类型属性取第一个文件的URL（外链文件和上传文件结构不一样，都兼容一下）
function getFileUrl(prop) {
  const files = prop?.files;
  if (!files || files.length === 0) return null;
  const first = files[0];
  return first.external?.url || first.file?.url || null;
}
