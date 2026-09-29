// /api/music.js — 网易云歌曲元数据代理（无密钥，线上/本地行为一致）
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  try {
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
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message, songs: [] });
  }
};
