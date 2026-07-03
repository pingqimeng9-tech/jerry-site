# Jerry Blog · Notion API 集成（字段已按真实数据库配置完成）

## 文件清单
```
api/posts.js   → 接口：获取已发布文章列表
api/post.js    → 接口：获取单篇文章详情（正文自动转 Markdown）
blog.html      → 页面：博客列表页
post.html      → 页面：文章详情页
package.json   → 依赖清单（@notionhq/client, notion-to-md）
```

## 字段映射（已按你的数据库截图配置好，无需再改）
type / slug / status / title / summary / category / date / tags
- status 列判断依据：值等于 "Published"
- type 列判断依据：值等于 "Post"（用来排除数据库里的导航菜单/页面类行）

如果实际测试发现值不是这两个英文词，回来告诉我，改字段值就是两行代码的事。

## 部署步骤

### 1. 上传文件到 jerry-site 仓库
- 仓库根目录新建 `api` 文件夹，把 `posts.js`、`post.js` 传进去
- `blog.html`、`post.html` 传到仓库根目录（跟 index.html 同级）
- `package.json`：如果仓库里还没有这个文件，直接传上去；如果已经有了，把里面 dependencies 那两行手动合并进现有文件

### 2. Vercel 环境变量
Settings → Environment Variables，添加：
- `NOTION_TOKEN` = 你的 Integration Token（密钥，不要发给任何人/AI）
- `NOTION_DATABASE_ID` = 77739abe70478264b65f81227260905c

### 3. 触发部署
文件传完 GitHub 会自动触发 Vercel 重新构建，等 1-2 分钟

### 4. 验证
1. 打开 `https://你的域名/api/posts`
   - `{"ok":true,"posts":[...]}` 有内容 → 成功
   - `posts` 空数组 → status/type 的值可能不是 Published/Post，回来告诉我
   - `ok:false` 带 error → 把 error 文本发我
2. 没问题后打开 `https://你的域名/blog.html` 看页面
3. 点进一篇文章，确认 `post.html` 详情页正文渲染正常
