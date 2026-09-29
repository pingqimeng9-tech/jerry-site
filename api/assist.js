// /api/assist.js — 站点辅助能力聚合（合并部署以节省函数名额）
//   GET  /api/assist?do=music&ids=1,2,3    网易云歌曲元数据代理（无密钥）
//   POST /api/assist?do=chat               AI 猫对话（GEMINI_API_KEY / OPENAI_API_KEY）
//   GET  /api/assist?do=ping               能力探测
//   POST /api/assist?do=send-code {email}  管理员邮箱登录发码（白名单）
//   POST /api/assist?do=verify-code {email,code}  校验并返回 magiclink token_hash
//
// 登录所需环境变量：SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、RESEND_API_KEY
// 管理员白名单：ADMIN_EMAIL（多个用逗号分隔；默认 zengaihua008@gmail.com）
const { createClient } = require('@supabase/supabase-js');

// 管理员白名单只从环境变量 ADMIN_EMAIL 读取（逗号分隔多个），代码库里不写死任何邮箱
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); } }
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function handleMusic(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  const ids = ((req.query && req.query.ids) || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return res.status(200).json({ ok: true, songs: [] });
  const url = 'https://music.163.com/api/song/detail/?id=' + ids[0] + '&ids=' + encodeURIComponent('[' + ids.join(',') + ']');
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com' } });
  const j = await r.json();
  const songs = (j.songs || []).map(s => ({
    id: s.id, name: s.name,
    artists: (s.artists || []).map(a => a.name).join(' / '),
    album: s.album && s.album.name || '',
    pic: (s.album && (s.album.blurPicUrl || s.album.picUrl)) || '',
    url: 'https://music.163.com/song/media/outer/url?id=' + s.id + '.mp3'
  }));
  res.status(200).json({ ok: true, songs });
}

async function handleChat(req, res) {
  const body = await readBody(req);
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const sys = body.systemPrompt || '你是博主的猫娘助理，回答亲切可爱。';
  const provider = body.provider || 'gemini';

  let reply = '';
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(200).json({ ok: false, error: '线上未配置 OPENAI_API_KEY 环境变量' });
    const base = (process.env.OPENAI_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: sys }, ...msgs.map(m => ({ role: m.role, content: String(m.content || '') }))]
      })
    });
    const j = await r.json();
    reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
    if (!reply) return res.status(200).json({ ok: false, error: (j.error && j.error.message) || '接口返回异常' });
  } else {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(200).json({ ok: false, error: '线上未配置 GEMINI_API_KEY 环境变量' });
    const model = body.model || 'gemini-2.0-flash';
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }))
      })
    });
    const j = await r.json();
    reply = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || []).map(p => p.text).join('');
    if (!reply) return res.status(200).json({ ok: false, error: (j.error && j.error.message) || 'Gemini 返回异常' });
  }
  res.status(200).json({ ok: true, reply });
}

// 管理员邮箱登录：发验证码（非白名单邮箱一律拒绝，不发信、不建会话）
async function handleSendCode(req, res) {
  const body = await readBody(req);
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: '邮箱格式不对' });
  }
  if (!ADMIN_EMAILS.length) {
    return res.status(503).json({ ok: false, error: '登录服务尚未配置完成（缺少 ADMIN_EMAIL）' });
  }
  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ ok: false, error: '该邮箱没有管理员权限' });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return res.status(503).json({ ok: false, error: '登录服务尚未配置完成（缺少服务端环境变量）' });
  }
  const admin = supabaseAdmin();

  const { data: existing } = await admin.from('email_otp_codes').select('created_at').eq('email', email).maybeSingle();
  if (existing) {
    const sec = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
    if (sec < RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({ ok: false, error: '请等 ' + Math.ceil(RESEND_COOLDOWN_SECONDS - sec) + ' 秒后再发送' });
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const { error: dbError } = await admin.from('email_otp_codes')
    .upsert({ email, code, expires_at: expiresAt, attempts: 0, created_at: new Date().toISOString() });
  if (dbError) throw dbError;

  const rr = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Jerry.dev <onboarding@resend.dev>',
      to: [email],
      subject: '你的 Jerry.dev 管理员登录验证码：' + code,
      html: '<div style="font-family:sans-serif;padding:24px;"><h2 style="margin:0 0 12px;">Jerry.dev 管理员登录</h2>'
        + '<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">' + code + '</p>'
        + '<p style="color:#666;font-size:13px;">' + CODE_TTL_MINUTES + ' 分钟内有效。如果不是你本人操作，请忽略并尽快检查账号安全。</p></div>'
    })
  });
  if (!rr.ok) throw new Error('Resend发送失败: ' + (await rr.text()).slice(0, 200));
  res.status(200).json({ ok: true, ttl: CODE_TTL_MINUTES });
}

// 校验验证码 → 返回 magiclink token_hash（前端 verifyOtp 兑换正式 session）
async function handleVerifyCode(req, res) {
  const body = await readBody(req);
  const email = (body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  if (!email || !code) return res.status(400).json({ ok: false, error: '缺少邮箱或验证码' });
  if (!ADMIN_EMAILS.length) return res.status(503).json({ ok: false, error: '登录服务尚未配置完成（缺少 ADMIN_EMAIL）' });
  if (!ADMIN_EMAILS.includes(email)) return res.status(403).json({ ok: false, error: '该邮箱没有管理员权限' });

  const admin = supabaseAdmin();
  const { data: record, error: fetchErr } = await admin.from('email_otp_codes').select('*').eq('email', email).maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!record) return res.status(400).json({ ok: false, error: '还没发送过验证码，或已经用过了' });
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await admin.from('email_otp_codes').delete().eq('email', email);
    return res.status(400).json({ ok: false, error: '验证码已过期，请重新发送' });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await admin.from('email_otp_codes').delete().eq('email', email);
    return res.status(400).json({ ok: false, error: '尝试次数过多，请重新发送验证码' });
  }
  if (record.code !== code) {
    await admin.from('email_otp_codes').update({ attempts: record.attempts + 1 }).eq('email', email);
    return res.status(400).json({ ok: false, error: '验证码不对' });
  }
  await admin.from('email_otp_codes').delete().eq('email', email);

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr) throw linkErr;
  const hashedToken = linkData && linkData.properties && linkData.properties.hashed_token;
  if (!hashedToken) throw new Error('未能从 Supabase 拿到登录 token');
  res.status(200).json({ ok: true, token_hash: hashedToken });
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const doWhat = (req.query && req.query.do) || (req.method === 'POST' ? 'chat' : '');
    if (doWhat === 'ping') {
      return res.status(200).json({
        ok: true,
        chatReady: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
        musicReady: true,
        authReady: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY)
      });
    }
    if (doWhat === 'music' && req.method === 'GET') return await handleMusic(req, res);
    if (doWhat === 'chat' && req.method === 'POST') return await handleChat(req, res);
    if (doWhat === 'send-code' && req.method === 'POST') return await handleSendCode(req, res);
    if (doWhat === 'verify-code' && req.method === 'POST') return await handleVerifyCode(req, res);
    res.status(404).json({ ok: false, error: '未知操作' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
