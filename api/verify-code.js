// 校验邮箱验证码。POST { email, code }
// 校验通过后用 Supabase Admin API 生成一个 magiclink token，
// 前端拿这个 token 去调 supabase.auth.verifyOtp() 换成真正的登录 session——
// 这样最终建立的还是一个正常、合法的 Supabase Auth 会话，跟 Google 登录建立的会话完全一样，
// 后面所有 RLS 规则、auth.uid() 都能正常用，不需要另外维护一套身份系统

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_ATTEMPTS = 5;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ ok: false, error: '缺少邮箱或验证码' });
  }

  try {
    const { data: record, error: fetchErr } = await supabaseAdmin
      .from('email_otp_codes')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!record) {
      return res.status(400).json({ ok: false, error: '还没发送过验证码，或者已经用过了' });
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('email_otp_codes').delete().eq('email', email);
      return res.status(400).json({ ok: false, error: '验证码已过期，请重新发送' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin.from('email_otp_codes').delete().eq('email', email);
      return res.status(400).json({ ok: false, error: '尝试次数太多了，请重新发送验证码' });
    }

    if (record.code !== String(code).trim()) {
      await supabaseAdmin
        .from('email_otp_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('email', email);
      return res.status(400).json({ ok: false, error: '验证码不对' });
    }

    // 验证码核对成功：先删掉这条记录（不能重复用），再去生成登录token
    await supabaseAdmin.from('email_otp_codes').delete().eq('email', email);

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    if (linkErr) throw linkErr;

    // hashed_token 就是前端要拿去 verifyOtp() 兑换成真实session的凭证
    const hashedToken = linkData?.properties?.hashed_token;
    if (!hashedToken) throw new Error('没能从Supabase拿到登录token，请检查Service Role Key是否配置正确');

    res.status(200).json({ ok: true, token_hash: hashedToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
