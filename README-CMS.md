# Jerry CMS · 本地文章管理控制台

把博客脱离 Notion，改成「本地 JSON 存储 + 本地服务 + 可视化编辑器」。**整个方案零依赖**（只用了 Node 自带模块），不碰你现有的任何页面文件，新增文件全部位于本目录。

## 这是什么

- `server.js` — 本地 HTTP 服务。托管整个博客静态站，并实现 `blog.html` / `post.html` 需要的全部接口。
- `admin/index.html` — 控制台首页：文章列表、统计、新建/编辑/发布/删除。
- `admin/editor.html` — 三栏编辑器：富文本工具栏 + 正文 + 右侧属性面板（分类/封面/标签/摘要/日期）+ 图床浮窗。
- `data/posts.json` — 文章数据中心（唯一真相源，所有发布/草稿都存在这里）。
- 图片上传后落在 `images/posts/`。

## 怎么启动

双击 `start-jerry-cms.bat`（启动器是纯 ASCII，不会因中文环境乱码）：它会开一个独立的 **JerryCMS Server** 窗口跑服务，2 秒后自动打开浏览器进**整站首页**；关闭那个服务窗口即停止站点。也可手动运行：

```
node server.js
```

然后浏览器打开：

| 地址 | 用途 |
|---|---|
| http://127.0.0.1:5858/ | 整站首页（导航含「草稿箱/设置」入口，仅本地可见） |
| http://127.0.0.1:5858/blog.html | 博客列表（自动读本地文章） |
| http://127.0.0.1:5858/post.html?id=文章id | 文章页（侧栏有「✎ 编辑本文」直达编辑器） |
| http://127.0.0.1:5858/admin/index.html | 管理控制台（文章列表/统计/新建/发布/删除） |
| http://127.0.0.1:5858/admin/editor.html?id=new | 三栏编辑器 |
| http://127.0.0.1:5858/admin/settings.html | 发布设置（Git 一键推送） |

改端口：启动前设环境变量 `PORT`，或直接改 `server.js` 里的 `PORT`（默认 5858）。

## 前端怎么接上的（零改动原理）

原有 `blog.html` 走 `GET /api/posts`、`post.html` 走 `GET /api/post?id=` 和 `POST /api/view`。`server.js` 用本地 `data/posts.json` 实现这三个接口，字段完全一致（`{ok, posts[{id,title,date,category,excerpt,views,cover}]}`、`{ok, post:{..., markdown}}`），所以**博客前端一行代码没改就脱离 Notion 了**。

## 整站 + 本地编辑模式（对标星辉模型）

启动器启动的是**整个网站**：所有原页面照常运行，编辑模式以内置页面形式长在站点里——

- **CMS 入口是一个单文件模块**：`admin/bridge.js` 探测到本地服务后，自动向当前页面右下角注入「草稿箱 / 设置 /（文章页）编辑本文」悬浮工具栏；四个页面只有一行 `<script src="/admin/bridge.js"></script>` 引用，改入口只动这一个文件；
- 部署到线上时 bridge 探测不到本地服务，工具栏不出现、不产生死链接；
- post.html 渲染正文用的 marked 来自 CDN，离线打开文章页需联网加载该脚本。

### 模块划分说明（partials 机制）

| 模块 | 文件 | 被谁使用 | 改动影响面 |
|---|---|---|---|
| CMS 工具栏（编辑入口） | `admin/bridge.js` | 四个页面 | 改这一个文件全站生效 |
| 管理端视觉体系 | `admin/admin.css` | admin 三页 | 换色/圆角/间距只动这里 |
| 通用包含器 | `partials/include.js` | 未来需要抽块的页面 | 新增不影响现有 |
| 页面区块占位 | `partials/*.html`（按需新建） | 通过 `<div data-include="/partials/xxx.html">` 引用 | 单区块独立演进 |

后续要把某个页面的大区块（如导航、页脚）抽成模块：把那段 HTML 拷到 `partials/`，原位置换成 `<div data-include="...">` 占位并引入 include.js 即可，逐块进行、互不影响。

## 一键推送到 Git（发布设置页）

`admin/settings.html` 配置一次仓库地址 + 分支 + 提交信息模板，之后点「一键推送」即执行 `git add -A → commit → push origin HEAD:分支`：

- 推送前会自动同步 origin 指向配置的仓库；仓库未初始化时点「初始化仓库」即可（git init + 绑 remote）；
- SSH 地址（git@github.com:...）走你本机已配置的 SSH Key，HTTPS 地址走凭据管理器；
- 若站内部署在 Vercel/Netlify 等平台并绑定了该仓库，推送后自动触发重新构建上线（对标星辉 B 线）；
- 相关接口：`/api/deploy/config`（读写配置，存 `data/deploy_config.json`）、`/api/deploy/check`、`/api/deploy/init`、`/api/deploy/publish`；
- `.cms-backup-*/` 已写入 `.gitignore` 不会进仓库。

## 字段与数据结构

`data/posts.json` 每篇文章：

| 字段 | 说明 |
|---|---|
| id | 唯一标识，基于标题生成，编辑时保持稳定 |
| title | 标题 |
| category | 分类（如 随笔/技术/生活） |
| excerpt | 摘要（首页卡片/搜索预览用） |
| cover | 封面图 URL |
| tags | 标签数组 |
| mood | 心情（可选） |
| views | 浏览量（/api/view 自增） |
| date | 日期 |
| status | `published` / `draft` |
| markdown | 正文（Markdown，post.html 用 marked 渲染） |

## 改动指南

- **改样式/配色/圆角**：`admin/admin.css`（变量在顶部 `:root`）。
- **改工具栏按钮**：`admin/editor.html` 里的 `T` 数组，按 `{t:'显示', a:'execCommand名', v:'值'}` 增删。
- **改数据存储**：默认 JSON 文件。想换成 SQLite 只改 `server.js` 的读写函数即可。
- **改端口 / 启动参数**：`server.js` 顶部 `PORT`，或 `.bat` 里的 `http://127.0.0.1:5858/...`。
- **接入真实图床**：`server.js` 的 `/api/upload` 目前存本地 `images/posts/`，改成调用图床 API 即可。

## 质量说明

- **响应式**：控制台与编辑器在 900px 以下自动收窄右侧面板；编辑区标题随屏幕缩放。
- **状态覆盖**：加载态（toast 提示）、空态（无文章）、错误态（加载/保存失败 toast）、hover/active/disabled 均有样式。
- **脏状态保护**：编辑后离开页面会触发 `beforeunload` 提醒，防止误丢。
- **表单校验**：标题必填、分类/摘要/封面可选、标签去重。
- **无障碍**：工具栏按钮带 title；关键控件为原生 button/input。
- **安全性**：静态文件做了路径穿越拦截；上传仅接受图片并清洗文件名。

## 已知边界

- `post.html` 渲染依赖 CDN 的 `marked.min.js`，离线打开文章页需联网加载该脚本（正文数据本身在本地）。完全离线也可在 `server.js` 挂一个本地 `marked`，需要的话说一声。
- 图片以 base64 上传到本地 `images/posts/`，适合个人博客规模。
