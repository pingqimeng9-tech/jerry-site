// /api/assist.js — 站点辅助能力聚合（合并部署以节省函数名额）
//   GET  /api/assist?do=music&ids=1,2,3   网易云歌曲元数据代理（无密钥）
//   POST /api/assist?do=chat              AI 猫对话（Key 读 Vercel 环境变量）
//        环境变量：GEMINI_API_KEY 或 OPENAI_API_KEY（可选 OPENAI_BASE）
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) { body = {}; }
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

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const doWhat = (req.query && req.query.do) || (req.method === 'POST' ? 'chat' : '');
    if (doWhat === 'music' && req.method === 'GET') return await handleMusic(req, res);
    if (doWhat === 'chat' && req.method === 'POST') return await handleChat(req, res);
    res.status(404).json({ ok: false, error: '未知操作：do=music(GET) 或 do=chat(POST)' });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
};
