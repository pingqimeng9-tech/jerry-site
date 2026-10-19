const crypto = require('crypto');

const OTP_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function adminEmails() {
  return (process.env.ADMIN_EMAIL || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function authSecret() {
  return process.env.ADMIN_SESSION_SECRET ||
    process.env.GITHUB_TOKEN ||
    process.env.RESEND_API_KEY ||
    '';
}

function authReady() {
  return !!(adminEmails().length && authSecret() && process.env.RESEND_API_KEY);
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function hmac(text) {
  return crypto.createHmac('sha256', 'jerry-admin-session|' + authSecret()).update(text).digest('base64url');
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  return body + '.' + hmac(body);
}

function verify(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !authSecret()) return null;
  const expected = hmac(parts[0]);
  const given = Buffer.from(parts[1]);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
  if (!payload || !payload.exp || Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function issueSession(email) {
  return sign({
    t: 'session',
    email: String(email || '').toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    v: 1
  });
}

function verifySession(token) {
  const payload = verify(token);
  if (!payload || payload.t !== 'session' || !payload.email) return null;
  return payload;
}

function otpKey() {
  return crypto.createHash('sha256').update('jerry-admin-otp|' + authSecret()).digest();
}

function issueOtp(email) {
  const code = String(crypto.randomInt(10000000, 100000000));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', otpKey(), iv);
  const plain = JSON.stringify({
    t: 'otp',
    email: String(email || '').toLowerCase(),
    code,
    exp: Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS
  });
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    code,
    token: b64url(Buffer.concat([iv, tag, enc])),
    ttlMinutes: OTP_TTL_SECONDS / 60
  };
}

function readOtp(token) {
  if (!authSecret()) return null;
  let raw;
  try {
    raw = Buffer.from(String(token || ''), 'base64url');
  } catch (e) {
    return null;
  }
  if (raw.length < 29) return null;
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', otpKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const payload = JSON.parse(plain);
    if (!payload || payload.t !== 'otp' || !payload.email || !payload.code) return null;
    if (Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function isAdmin(email) {
  return adminEmails().includes(String(email || '').trim().toLowerCase());
}

module.exports = {
  OTP_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  adminEmails,
  authSecret,
  authReady,
  isAdmin,
  issueOtp,
  readOtp,
  issueSession,
  verifySession
};
