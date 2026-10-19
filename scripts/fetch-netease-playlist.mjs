import fs from 'fs';
import path from 'path';

const PLAYLIST_ID = process.argv[2] || '18489916586';
const OUT = path.resolve(process.cwd(), 'site', 'data', 'music_playlist.json');
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Referer: 'https://music.163.com/'
};

async function json(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  return r.json();
}

const detail = await json('https://music.163.com/api/v6/playlist/detail?id=' + encodeURIComponent(PLAYLIST_ID));
if (!detail.playlist) throw new Error(' playlist not found');
const playlist = detail.playlist;
const ids = (playlist.trackIds || []).map(x => x.id).filter(Boolean);
const tracks = [];
for (let i = 0; i < ids.length; i += 100) {
  const chunk = ids.slice(i, i + 100);
  const data = await json('https://music.163.com/api/song/detail/?ids=' + encodeURIComponent(JSON.stringify(chunk)));
  (data.songs || []).forEach(song => tracks.push({
    id: String(song.id),
    name: song.name || '',
    artists: (song.artists || []).map(a => a.name).join(' / '),
    album: song.album && song.album.name || '',
    cover: song.album && song.album.picUrl || '',
    duration: song.duration || 0,
    url: 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3'
  }));
}
const byId = new Map(tracks.map(t => [t.id, t]));
const ordered = ids.map(id => byId.get(String(id))).filter(Boolean);
const payload = {
  format: 'jerry-music-playlist/v1',
  fetchedAt: new Date().toISOString(),
  source: {
    id: String(playlist.id),
    name: playlist.name || '网易云歌单',
    cover: playlist.coverImgUrl || '',
    userId: String(playlist.userId || ''),
    trackCount: ordered.length
  },
  tracks: ordered
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('Fetched ' + ordered.length + ' tracks -> ' + path.relative(process.cwd(), OUT));
