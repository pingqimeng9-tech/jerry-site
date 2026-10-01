/* ============================================================
 * uploader.js — Jerry CMS 统一上传（本地 / 线上双通道）
 *
 * 本地（127.0.0.1/localhost）：
 *   文件转 base64 → POST /api/upload（本地 server 直接写盘，无大小硬限）
 * 线上：
 *   POST /api/upload-sign（管理员鉴权，签发一次性地址）
 *   → 浏览器把文件二进制直传 Supabase Storage（不经过 Vercel 函数，
 *     绕开 Serverless 4.5MB 请求体 / 10s 超时限制，图片、视频都能传）
 *
 * 对外 API：
 *   JerryUpload.uploadFile(file, { dir })                 → { ok, url, name, size }
 *   JerryUpload.uploadDataUrl(dataUrl, { dir, filename }) → { ok, url, name, size }
 *   dir 可选：images/posts(默认) videos/posts files/posts images/bg images/pet images/albums
 * ============================================================ */
(function () {
  'use strict';
  if (window.JerryUpload) return;

  var isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);

  function dataUrlToBlob(dataUrl) {
    var m = /^data:([^;]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl) || [];
    var type = m[1] || 'application/octet-stream';
    var bin = atob(m[3] || '');
    var len = bin.length, u8 = new Uint8Array(len);
    for (var i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: type });
  }
  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('读取文件失败')); };
      fr.readAsDataURL(blob);
    });
  }
  function safeName(n) { return (n || 'file').split(/[\\/]/).pop().replace(/[^\w.一-龥-]/g, '_') || 'file'; }

  // 直传 Supabase（XHR 以便汇报进度）
  function putSigned(url, blob, type, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', type || blob.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.upload.onprogress = function (e) { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
      xhr.onload = function () { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error('直传失败 ' + xhr.status)); };
      xhr.onerror = function () { reject(new Error('直传网络错误')); };
      xhr.send(blob);
    });
  }

  async function uploadOnline(blob, opts) {
    var filename = opts.filename || ('upload-' + Date.now());
    var type = opts.contentType || blob.type || 'application/octet-stream';
    var dir = opts.dir || 'images/posts';
    var r = await fetch('/api/upload-sign', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: filename, dir: dir, contentType: type, size: blob.size })
    });
    var d = await r.json().catch(function () { return null; });
    if (!d || d.ok === false || !d.signedUrl) throw new Error((d && d.error) || '获取上传凭证失败');
    await putSigned(d.signedUrl, blob, type, opts.onProgress);
    return { ok: true, url: d.publicUrl, name: filename, size: blob.size };
  }

  async function uploadLocal(blob, opts) {
    var filename = opts.filename || ('upload-' + Date.now());
    var dir = opts.dir || 'images/posts';
    var dataUrl = await blobToDataUrl(blob);
    var endpoint = dir === 'files/posts' ? '/api/attachment/upload' : '/api/upload';
    if (opts.onProgress) opts.onProgress(30);
    var r = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: filename, base64: dataUrl, dir: dir })
    });
    var d = await r.json().catch(function () { return null; });
    if (!d || d.ok === false) throw new Error((d && d.error) || '本地上传失败');
    if (opts.onProgress) opts.onProgress(100);
    return d;
  }

  async function uploadBlob(blob, opts) {
    opts = opts || {};
    if (opts.filename) opts.filename = safeName(opts.filename);
    return isLocal ? uploadLocal(blob, opts) : uploadOnline(blob, opts);
  }
  async function uploadFile(file, opts) {
    opts = Object.assign({ filename: file.name, contentType: file.type }, opts || {});
    return uploadBlob(file, opts);
  }
  async function uploadDataUrl(dataUrl, opts) {
    opts = opts || {};
    var blob = dataUrlToBlob(dataUrl);
    if (!opts.filename) {
      var ext = (blob.type.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
      opts.filename = 'image-' + Date.now() + '.' + ext;
    }
    if (!opts.contentType) opts.contentType = blob.type;
    return uploadBlob(blob, opts);
  }

  window.JerryUpload = {
    isLocal: isLocal,
    uploadFile: uploadFile,
    uploadBlob: uploadBlob,
    uploadDataUrl: uploadDataUrl
  };
})();
