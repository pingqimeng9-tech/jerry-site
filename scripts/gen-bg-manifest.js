#!/usr/bin/env node
/**
 * 扫描 /images/bg 文件夹，把里面所有图片文件名写进 manifest.json
 * post.html 会读这个清单来做背景轮播，你不需要手动维护它。
 *
 * 用法：
 *   node scripts/gen-bg-manifest.js
 *
 * 支持格式：jpg, jpeg, png, webp, gif, avif, bmp
 * 想扫别的文件夹（比如以后要做相册），改下面 TARGET_DIR 就行。
 */
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'images', 'bg');
const OUTPUT_FILE = path.join(TARGET_DIR, 'manifest.json');
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp']);

function main(){
  if(!fs.existsSync(TARGET_DIR)){
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`创建了文件夹：${TARGET_DIR}（之前不存在）`);
  }

  const files = fs.readdirSync(TARGET_DIR)
    .filter(f => ALLOWED_EXT.has(path.extname(f).toLowerCase()))
    .filter(f => f !== 'manifest.json')
    .sort();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(files, null, 2), 'utf-8');

  if(files.length === 0){
    console.log('没找到任何图片。把图片文件拖进 images/bg/ 文件夹，再重新跑一次这个脚本。');
  } else {
    console.log(`写入了 ${files.length} 张图片到 manifest.json：`);
    files.forEach(f => console.log('  - ' + f));
  }
}

main();
