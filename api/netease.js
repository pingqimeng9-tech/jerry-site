// Folia NetEase proxy — maps /api/netease/<endpoint> to @neteasecloudmusicapienhanced/api modules.
const ncm = require('@neteasecloudmusicapienhanced/api');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
  }
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('Cache-Control', 'no-store');

  let rawPath = req.query && req.query.path;
  if (Array.isArray(rawPath)) rawPath = rawPath.join('/');
  if (!rawPath) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    rawPath = pathname.replace(/^\/api\/netease\/?/, '');
  }
  const endpoint = String(rawPath || '').replace(/^\/+|\/+$/g, '').replace(/[\/-]/g, '_');
  const fn = ncm[endpoint];
  if (!endpoint || typeof fn !== 'function') {
    return res.status(404).json({ code: 404, message: 'Unknown NetEase endpoint: ' + endpoint });
  }

  const data = Object.assign({}, req.query || {});
  delete data.path;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    Object.assign(data, await readBody(req));
  }
  if (req.headers && req.headers.cookie && !data.cookie) data.cookie = req.headers.cookie;

  if (endpoint === 'song_url_v1' || endpoint === 'song_url') {
    const id = String(data.id || data.ids || '').replace(/[^0-9,]/g, '').split(',')[0];
    if (id) {
      return res.status(200).json({
        code: 200,
        data: [{
          id: Number(id),
          url: 'https://music.163.com/song/media/outer/url?id=' + encodeURIComponent(id) + '.mp3',
          br: 128000,
          size: 0,
          md5: null,
          code: 200,
          expi: 1200,
          type: 'mp3',
          gain: 0,
          peak: null,
          closedGain: 0,
          closedPeak: 0,
          fee: 0,
          uf: null,
          payed: 0,
          flag: 0,
          canExtend: false,
          freeTrialInfo: null,
          level: 'standard',
          encodeType: 'mp3',
          time: 0
        }]
      });
    }
  }

  try {
    const answer = await fn(data);
    const payload = answer && Object.prototype.hasOwnProperty.call(answer, 'body') ? answer.body : answer;
    if (answer && typeof answer.cookie === 'string' && answer.cookie) {
      res.setHeader('Set-Cookie', answer.cookie);
    }
    return res.status(200).json(payload == null ? { code: 200, data: payload } : payload);
  } catch (error) {
    const status = error && error.body && error.body.code ? 200 : 500;
    return res.status(status).json({
      code: (error && error.body && error.body.code) || 500,
      message: (error && error.message) || 'Netease proxy failed'
    });
  }
};
