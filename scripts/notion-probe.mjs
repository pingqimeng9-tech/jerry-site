// Notion 迁移 - 连通性与结构探查（只读，不写任何数据）
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB = process.env.NOTION_DATABASE_ID;

try {
  const db = await notion.databases.retrieve({ database_id: DB });
  console.log('数据库标题:', (db.title || []).map(t => t.plain_text).join('') || '(无标题)');
  console.log('data_sources:', JSON.stringify((db.data_sources || []).map(d => d.id)));
  console.log('--- 属性字段 ---');
  for (const [name, prop] of Object.entries(db.properties || {})) {
    let extra = '';
    if (prop.type === 'select' || prop.type === 'status') {
      const opts = (prop[prop.type]?.options || []).map(o => o.name);
      extra = ' 选项: ' + opts.join(' / ');
    }
    console.log(`  [${prop.type}] ${name}${extra}`);
  }

  const dsId = db.data_sources?.[0]?.id;
  const all = [];
  let cursor;
  do {
    const r = await notion.dataSources.query({ data_source_id: dsId, start_cursor: cursor, page_size: 100 });
    all.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  console.log(`\n总行数(含各种状态/类型): ${all.length}`);

  const txt = (p, key) => {
    const v = p.properties?.[key];
    if (!v) return '';
    const arr = v.title || v.rich_text || [];
    return arr.map(t => t.plain_text).join('');
  };
  all.forEach((p, i) => {
    const get = key => {
      const v = p.properties?.[key];
      if (!v) return '';
      if (v.type === 'select') return v.select?.name || '';
      if (v.type === 'status') return v.status?.name || '';
      if (v.type === 'date') return v.date?.start || '';
      if (v.type === 'number') return String(v.number ?? '');
      if (v.type === 'files') return `[${v.files.length}个文件]`;
      if (v.type === 'checkbox') return String(v.checkbox);
      return '';
    };
    const title = txt(p, 'title') || txt(p, 'Name') || txt(p, '名称') || '(无标题)';
    console.log(`${String(i + 1).padStart(2)}. ${title} | status=${get('status')} type=${get('type')} date=${get('date')} cat=${get('category')} views=${get('浏览量')} cover=${get('Files & media')} id=${p.id}`);
  });
} catch (e) {
  console.error('失败:', e.code || '', e.message);
  process.exit(1);
}
