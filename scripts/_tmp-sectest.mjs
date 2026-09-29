const base = 'https://callmiruko.cc';
async function post(path, body) {
  try {
    const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    console.log(path, '=>', r.status, (await r.text()).slice(0, 180));
  } catch (e) { console.log(path, '=> ERR', e.message); }
}
async function get(path) {
  try {
    const r = await fetch(base + path);
    console.log(path, '=>', r.status, (await r.text()).slice(0, 180));
  } catch (e) { console.log(path, '=> ERR', e.message); }
}
await get('/api/assist?do=ping&z=' + Date.now());
// 非白名单邮箱：必须 403
await post('/api/assist?do=send-code', { email: 'hacker@evil.com' });
// 白名单邮箱但服务端环境变量未配：应 503 友好提示
await post('/api/assist?do=send-code', { email: 'zengaihua008@gmail.com' });
// 伪造 token 调 cms：必须 401
try {
  const r = await fetch(base + '/api/cms?do=admin-posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fake.jwt.token' }, body: '{}'
  });
  console.log('cms 伪造token =>', r.status, (await r.text()).slice(0, 180));
} catch (e) { console.log('cms ERR', e.message); }
// 不带 token
try {
  const r = await fetch(base + '/api/cms?do=post-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  console.log('cms 无token =>', r.status, (await r.text()).slice(0, 180));
} catch (e) { console.log('cms ERR', e.message); }
