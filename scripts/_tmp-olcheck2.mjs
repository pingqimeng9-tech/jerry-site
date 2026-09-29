const B = 'https://callmiruko.cc';
const checks = [
  ['/', 200], ['/blog.html', 200], ['/post.html', 200],
  ['/admin/index.html', 200],
  ['/admin/studio/bridge.js', 200], ['/admin/studio/cms-adapter.js', 200],
  ['/admin/studio/inline-editor.js', 200],
  ['/assets/inline-editor.js', 404] // 已移走，旧路径不应存在
];
const fail = [];
for (const [u, want] of checks) {
  try { const r = await fetch(B + u); if (r.status !== want) fail.push(u + ' 期望' + want + ' 实际' + r.status); }
  catch (e) { fail.push(u + ' ERR ' + e.message); }
}
console.log(fail.length ? fail.join('\n') : '资源路径全部符合预期 ✓');
const home = await (await fetch(B + '/')).text();
console.log('首页含 studio bridge 引用:', home.includes('/admin/studio/bridge.js'));
const admin = await (await fetch(B + '/admin/index.html')).text();
console.log('后台页先引 adapter 再引 auth:', admin.indexOf('cms-adapter.js') !== -1 && admin.indexOf('cms-adapter.js') < admin.indexOf('admin-auth.js'));
const bridge = await (await fetch(B + '/admin/studio/bridge.js')).text();
console.log('bridge 双环境逻辑: 本地=', bridge.includes('isLocal'), ' 会话痕迹探测=', bridge.includes('auth-token'), ' 无痕迹return=', bridge.includes("if (!trace) return"));
const adapter = await (await fetch(B + '/admin/studio/cms-adapter.js')).text();
console.log('adapter 无邮箱:', !/zengaihua|gmail\.com/.test(adapter), ' 含 cms 写通道:', adapter.includes('/api/cms'));
