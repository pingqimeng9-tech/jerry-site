const B = 'https://callmiruko.cc';
const urls = ['/','/blog.html','/post.html','/photowall.html','/friends.html','/moments.html','/projects.html','/timeline.html','/rumi.html',
'/admin/index.html','/admin/admin-auth.js','/admin/bridge.js',
'/assets/layout.js','/assets/site-kit.js','/assets/pet.js','/css/blog.css','/partials/include.js',
'/data/layout_config.json','/data/pet_packs.json','/site.config.json',
'/api/posts','/api/projects','/api/friends','/api/moments','/api/albums','/images/bg/manifest.json'];
const fail = [];
for (const u of urls) {
  try { const r = await fetch(B + u, { headers: { 'Cache-Control': 'no-cache' } }); if (r.status !== 200) fail.push(r.status + ' ' + u); }
  catch (e) { fail.push('ERR ' + u + ' ' + e.message); }
}
console.log(fail.length ? '失败:\n' + fail.join('\n') : '线上 ' + urls.length + ' 个 URL 全部 200 ✓');
const posts = await (await fetch(B + '/api/posts')).json().catch(() => null);
console.log('线上 api/posts 文章数:', posts?.posts?.length ?? '解析失败');
const projects = await (await fetch(B + '/api/projects')).json().catch(() => null);
console.log('线上 api/projects 条目:', projects?.items?.length ?? projects?.projects?.length ?? '解析失败');
