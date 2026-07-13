// 发送邮箱验证码。POST { email }
// 需要的环境变量（去 Vercel 项目 Settings → Environment Variables 加）：
//   SUPABASE_URL              —— 跟前端用的是同一个 Project URL
//   SUPABASE_SERVICE_ROLE_KEY —— Supabase 后台 Settings → API Keys 里的 secret key（sb_secret_xxx），
//                                 千万不要跟前端那个 publishable key 搞混，这个绝对不能出现在前端代码里
//   RESEND_API_KEY            —— Resend 后台生成的 API Key

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60; // 同一个邮箱60秒内不能重复发送，防止被刷

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: '邮箱格式不对' });
  }

  try {
    // 冷却检查：看看是不是刚发过
    const { data: existing } = await supabaseAdmin
      .from('email_otp_codes')
      .select('created_at')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      const secondsSinceLast = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          ok: false,
          error: `请等 ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} 秒后再重新发送`
        });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6位数字，不会以0开头缺位
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from('email_otp_codes')
      .upsert({ email, code, expires_at: expiresAt, attempts: 0, created_at: new Date().toISOString() });

    if (dbError) throw dbError;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Jerry.dev <onboarding@resend.dev>', // ★ 换成你自己在Resend验证过的域名邮箱后，记得改这里
        to: [email],
        subject: `你的登录验证码：${code}`,
        html: `
          <div style="font-family:sans-serif;padding:24px;">
            <h2 style="margin:0 0 12px;">Jerry.dev 登录验证码</h2>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">${code}</p>
            <p style="color:#666;font-size:13px;">${CODE_TTL_MINUTES}分钟内有效，如果不是你本人操作，忽略这封邮件即可。</p>
          </div>
        `
      })
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      throw new Error('Resend发送失败: ' + errText);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
