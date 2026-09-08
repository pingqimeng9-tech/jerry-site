# Jerry CMS 更新台账

> 每轮模块化更新的改动范围、验证结果与遗留事项都在这里，可追溯后续更新。
> 日期均为本地记录时间。

---

## 2026-09-08 · 第三轮：草稿箱对标改版 + 视频插入 + 网站包实时预览

### 改动范围

| 模块 | 文件 | 改动内容 |
|---|---|---|
| 草稿箱页 | `admin/index.html`（v2 重写） | 对标星辉草稿箱：标题「📝 创作草稿箱」+ 计数徽章 + 副标题 + 「检索草稿…」搜索胶囊 + 「✍️ 新建文章」；卡片改纵向全宽玻璃卡（状态徽章+分类+日期+✕ 删除+标题+摘要+编辑/预览/发布切换），支持按标题/摘要/分类实时搜索与状态筛选 |
| 媒体工作台 | `admin/editor.html` | 图床工具升级为四 Tab：图片 / 视频 / 外链 / 网站包；视频上传后以原生 `<video controls>` 插入正文；网站包 zip 上传解压后插入「点击加载预览」占位块 |
| 媒体上传 | `server.js` | `/api/upload` 按扩展名分流：图片→`images/posts/`，视频（mp4/webm/mov/m4v/mkv/avi）→`videos/posts/`；新增 `/api/package/upload`（zip 上传→`packages/<id>/` 存储+bsdtar 解压（回退 Expand-Archive）+自动探测入口 html）、`/api/packages` 列表；大文件上限分开（媒体 120MB / 包 160MB） |
| 网站包预览 | `admin/embed.js`（新增） | 类 VSCode Live Server 增强器：占位块默认不加载，点击加载 iframe；右上 ⋯ 菜单 = 加载预览 / ⛶ 全屏预览 / 📱 横屏预览（fullscreen+orientation lock）/ ⬇️ 下载 ZIP / ↗ 新窗口打开；样式自注入，宿主页面零改动 |
| CMS 入口 | `admin/bridge.js`（v3） | 入口从悬浮胶囊改为**注入站点自身导航**（nav .links 尾部追加「草稿箱/设置」，样式自动继承；无 .links 的页面挂进 nav）——对标星辉「主页导航就有草稿箱」；文章页保留悬浮「✎ 编辑本文」；检测到 .site-preview 时自动加载 embed.js |
| Markdown 转换器 | `admin/editor.html` | 原始 HTML 块透传（video/figure/site-preview/iframe 行不转义）；保存时把 video/网站包占位规范化重建（丢弃编辑期已加载的 iframe 状态） |

### 验证结果

- 视频上传：mp4 → `videos/posts/`，回读 200 + `video/mp4`，kind=video。
- 网站包全链路：zip 上传 → bsdtar 解压 → 入口探测 `index.html` → 占位插入 → 保存/回读 data-src 保留 → 入口页 200 含内容 → zip 下载 200 application/zip → `/api/packages` 列表正确。
- 四页 + admin 三页 + embed.js 全部 200；bridge v3 含导航注入与 embed 加载逻辑。
- 线上兼容：占位在无本地服务时不加载（默认就是未加载态），⋯ 菜单里的下载/新窗口仍可用（静态包文件若一并推送则全部可用）。

### 遗留事项

1. 网站包与视频文件随 git 推送会显著增大仓库体积（视频尤其），如介意可在 `.gitignore` 加 `packages/`、`videos/posts/`（嵌入代码仍在帖子里，路径需另行托管）。
2. zip 解压用 bsdtar，未做 zip-slip 防护（本机自用工具，包来源是自己）。
3. 真实 Git 推送仍需在设置页填入仓库地址。

---

## 2026-09-08 · 第二轮：风格适配 + 编辑器补全 + 模块化 + DevTools 启动器

### 改动范围

| 模块 | 文件 | 改动内容 |
|---|---|---|
| 管理端视觉体系 | `admin/admin.css`（v2 重写） | 全部设计变量替换为原站同款：深紫渐变背景（含 22s bgshift 动画）、白透明玻璃面板（rgba 255,.10/.16 + 边框 .28）、coral/aqua/violet/pink 四强调色、Noto Sans SC 正文 + JetBrains Mono 标签/数字；圆角从 50px 收敛到 14/20px 贴合原站尺度；主按钮改 coral→pink 渐变；滚动条重做；保留 v1 全部类名并加 `--indigo/--emerald/--border/--red/--yellow` 兼容别名 |
| 文本编辑器 | `admin/editor.html`（v2） | 补齐对标星辉 RichTextEditor 的缺失功能：①字号下拉 14–48px；②上标/下标；③任务列表（勾选框，Markdown `- [ ]`/`- [x]` 往返支持）；④选中图片浮动宽度条（25/50/75/100%）；⑤字色 + 高亮色双取色器模态（站点同款 8 色板 + HEX 输入 + 最近 6 色 localStorage 持久化 + 右键移除）；⑥styleWithCSS 全局开启；⑦工具栏 active 态随光标实时刷新 |
| CMS 入口模块化 | `admin/bridge.js`（v2） | 升级为自注入工具栏：探测本地服务成功后动态注入「草稿箱/设置/（文章页）编辑本文」悬浮胶囊（站点同款玻璃质感）；入口样式/行为集中在单文件 |
| 四个站点页面 | `index.html` `blog.html` `post.html` `rumi.html` | 移除上一轮散落的 11 处静态隐藏入口（各页仅保留 1 行 bridge.js 引用）；页面回归原版 + 1 行引用的最小侵入状态 |
| 推送强化 | `server.js` | `/api/deploy/check` 返回待推送文件清单（状态标记 + 路径，上限 50 条）；默认提交信息改为「Update pages & posts via Jerry CMS」——页面代码与帖子一起推送 |
| 推送界面 | `admin/settings.html` | 检测结果新增「待推送清单」逐文件展示；文案明确“帖子与页面代码一起上去” |
| DevTools 启动器 | `start-jerry-cms.bat`（重写） | 纯 ASCII；自动探测 Edge/Chrome 并以 `--auto-open-devtools-for-tabs` 打开整站（对标星辉 webview debug=True 的 DevTools 模式）；找不到 Chromium 系浏览器时回退默认浏览器；服务仍跑在独立可关窗口 |
| 模块化机制 | `partials/include.js`（新增） | data-include 占位加载器 + {{KEY}} 变量替换，供后续把页面大区块抽成独立模块 |

### 编辑器功能对照清单（星辉 RichTextEditor ↔ Jerry CMS 编辑器 v2）

| 功能 | 星辉 | 本版 | 说明 |
|---|---|---|---|
| 撤销/重做/清除格式 | ✓ | ✓ | |
| 段落/H1/H2/H3 | ✓ | ✓ | |
| 加粗/斜体/下划线/删除线 | ✓ | ✓ | |
| 代码块 | ✓ | ✓ | |
| 字号 14–48px | ✓ | ✓ | 新增（selection 包裹 span） |
| 对齐 左/中/右 | ✓ | ✓ | |
| 无序/有序列表 | ✓ | ✓ | |
| 任务列表 | ✓ | ✓ | 新增（checkbox + `- [ ]` 往返） |
| 引用块 | ✓ | ✓ | |
| 上标/下标 | ✓ | ✓ | 新增 |
| 链接（自动补 https、空串解除） | ✓ | ✓ | |
| 图片插入 + 图床浮窗 | ✓ | ✓ | |
| 选中图片宽度 25/50/75/100% | ✓ | ✓ | 新增（浮动宽度条） |
| 字色（预设+HEX+最近色+右键移除） | ✓ | ✓ | 新增（色板换成站点同款色） |
| 高亮色（同上） | ✓ | ✓ | 新增 |
| 分隔线 | — | ✓ | 本版多出 |
| Markdown 存储往返 | ✓（tiptap-markdown） | ✓（自研转换器） | |
| 标题锁定（about 模式） | ✓ | —（不适用） | jerry 无 about 页管理模式，接口保留 |
| 图片圆角阴影渲染 | ✓ | ✓ | |

### 验证结果

- `node --check server.js` 通过；启动后 6 个页面/接口 200（首页/博客/文章/控制台/设置页/bridge.js）。
- `/api/deploy/check` 正确返回待推送文件清单；`/api/deploy/config` 存读一致；未配置仓库时推送返回友好错误。
- 四页回归：`</html>` 结构完整、原导航/功能标记齐全、`cms-local-link`/`local-edit-btn` 静态入口清零、bridge.js 引用保留。
- mdToHtml 转换器单测（标题/加粗/列表/任务列表/引用/代码/图片/链接）通过。
- 新旧样式对齐：admin 三页 `:root` 与原站完全同源（见 admin.css 头部注释），背景/玻璃/强调色/字体四项逐项核对一致。

### 遗留事项

1. 字号/字色/高亮在 Markdown 往返后不保留（Markdown 语法本身不承载内联样式，post.html 的 marked 会渲染内联 HTML 但编辑器导出纯文本语义）——如需保留改存 HTML 字段即可，待确认。
2. 真实 Git 推送未执行：需要在设置页填入你的仓库地址（SSH 建议），填好后点检测→初始化→推送即可。
3. 「新旧页面对比截图」：本环境无页面截图工具，改以设计变量对照表 + admin.css 头部同源注释作为佐证；你本地打开 admin 页即可目视对比。
4. 线上 Notion API（callmiruko.cc）未做任何改动；本地新版本推上去后，线上 blog/post 依旧走 Notion 接口，CMS 入口在线上自动隐藏。

---

## 2026-09-08 · 第四轮：推送流水线落地

### 改动范围

| 模块 | 文件 | 改动内容 |
|---|---|---|
| 本地仓库 | .git/（新增） | git init -b main + 首次提交 481bc95（240 文件）+ d8e8a3d（清理测试残留）；.gitignore 追加 node_modules/.vercel/Thumbs.db/.DS_Store |
| 接管远端 | server.js 新增 /api/deploy/adopt | 解决「远端还是旧版」的首推拒绝问题：fetch → reset --mixed origin/分支（保留远端历史，以本地文件为准）→ commit → push；远端为空时自动走普通首推 |
| 设置页 | dmin/settings.html | 新增「🔌 首次接管远端（以本地为准）」按钮（带确认弹窗），与「一键推送」并列 |

### 验证结果

- 本地仓库：240 文件入库，git 身份 qiu/zengaihua008@gmail.com。
- 空远端首推：publish → 远端收到全部 2 条提交 ✓。
- 旧远端接管（用 Downloads 原版备份构建旧远端实测）：adopt → 远端提交链 = 旧版提交 + 接管提交；远端 HEAD 的 blog.html 已是新版（含 bridge）、admin/ 目录存在、api/（Notion 接口）原样保留 ✓。
- 测试后已还原：本地回到 d8e8a3d、origin 已移除、deploy_config 清空、测试远端删除、服务已停。

### 遗留事项

1. 真实推送只差仓库地址：设置页填入（建议 SSH）→ 保存 → 检测 → 「首次接管远端」→ 完成。
2. adopt 会把远端旧文件覆盖为本地新版（含删除远端有而本地没有的文件），执行前有确认弹窗。