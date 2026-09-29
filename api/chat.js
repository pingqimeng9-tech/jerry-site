// /api/chat.js — 线上 AI 猫对话代理（Vercel serverless）
// Key 从环境变量读取，绝不进公开仓库：
//   Gemini:  GEMINI_API_KEY
//   OpenAI 兼容: OPENAI_API_KEY（可选 OPENAI_BASE，默认 https://api.openai.com/v1）
// 未配置环境变量时返回 200 + ok:false，前端自动显示"猫猫睡着了"降级提示。
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: '只支持 POST' });

  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) { body = {}; }
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const sys = body.systemPrompt || '你是博主的猫娘助理，回答亲切可爱。';
  const provider = body.provider || 'gemini';

  try {
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
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
};
