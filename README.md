# 龙吟写作

面向长篇作者的本地优先创作工具：大纲、正文写作、世界观、地图、装备、素材与灵感，数据按账户归属并存储在本地服务器。

## 运行

前置要求：Node.js 18+（无需 npm install，服务器零依赖）。

```bash
# Windows
start.bat
# macOS / Linux
./start.sh
# 或手动
node server/server.js
```

启动后控制台会同时打印本机地址和局域网地址。默认监听 `0.0.0.0:8765`：

- 本机访问：`http://127.0.0.1:8765`
- 局域网访问：`http://<本机局域网IP>:8765`，例如 `http://192.168.1.20:8765`

### 局域网访问

同一 Wi-Fi 或局域网内的电脑、平板和手机可直接打开控制台打印的局域网地址，使用各自账户登录。登录状态按浏览器保存，切换访问地址后需要重新登录。

- Windows 首次启动若出现防火墙提示，请允许 Node.js 访问“专用网络”；否则其他设备无法连接。
- 可通过 `LY_PORT` 修改端口，通过 `LY_HOST` 修改监听地址。
- 仅允许本机访问：macOS / Linux 使用 `LY_HOST=127.0.0.1 node server/server.js`，Windows 命令行使用 `set LY_HOST=127.0.0.1 && node server\server.js`。
- 局域网内使用明文 HTTP 传输，请仅在可信网络中开启。需要通过互联网访问时，应在前面加 HTTPS 反向代理或通过 VPN 接入，不要直接裸露端口。

其他信息：

- 演示账户：`demo@longyin.local` / `demo1234`（首次启动自动创建，含一部示例作品）
- 新账户：登录页"立即注册"，注册后自动创建一部空白作品
- 数据目录：`./data`（可用环境变量 `LY_DATA_DIR` 改路径）；复制该目录即完整备份

## 目录结构

```text
server/                  零依赖本地服务器
  server.js              启动、监听、路由装配
  config.js              端口、主机、目录和请求上限
  http.js                信封、请求解析、静态资源、鉴权守卫
  routes/                认证、账户、AI 的传输层
  services/              业务规则、校验、限流和 AI 编排
  repositories/          账户与作品数据访问接口
  storage.js             文件读写、会话、加密、md 主副本
  seed.js                演示账户与空白作品工厂
shared/
  contracts.js           前后端共享的 API 版本、字段限制和提示文案
  ai-actions.js          AI 动作、标签、指令模板与消息构建（服务端权威）
web/                     免构建前端（原生 ES Modules）
  index.html             应用外壳与模块入口
  styles/                tokens / base / atelier / typography 分层样式
  js/core/               store、API 传输、持久化队列、主题、工具
  js/domain/             作品选择、实体引用、章节扫描、中文排版、地图、关系图、写作、AI
    maps/                地形生成、地图模型、画布绘制
    writing/             查找排版、历史撤销、引用面板、@ 选择器
    ai/                  标签、上下文、离线模拟、结果解析、运行入口
  js/dialogs/            实体字段配置、实体表单、基础弹窗、数据弹窗、分发
  js/controllers/        按功能拆分的点击/提交/输入/指针控制器
  js/ui/                 应用壳、命令面板、登录视图
  js/pages/              按页面拆分的渲染模块
  js/events/             薄事件分发与键盘、窗口事件
  js/app/                页面装配、路由、会话用例、启动
scripts/verify.mjs       自动化门禁
docs/                    规范、调研和原型基线
```

### 架构规则

- 前端为原生 ES Modules，无构建步骤；`web/index.html` 只加载 `js/app.js`。
- `js/core/store.js` 是唯一可变状态仓库；其他模块只读取 live binding 或调用 setter。
- `js/controllers/` 承载交互用例；`js/domain/` 只做领域选择、计算与数据变更；`js/pages/` 只产出页面标记。
- 事件层按功能分发，不再按点击/提交等事件通道堆叠业务分支。
- 前端模块依赖图必须无循环（门禁自动检查）；传输层 `core/api.js` 不依赖渲染或登录用例。
- 后端依赖方向：`routes → services → repositories → storage`；路由只做传输适配与参数校验。
- `shared/contracts.js` 是账号、密码、笔名限制与 API 版本的唯一来源；`shared/ai-actions.js` 是 AI 指令与系统提示词的唯一来源。
- 数据按资源写入并使用版本号 `revision`；版本过期返回 `409`，避免多设备静默覆盖。

## 存储模型

- 每章正文独立 md 文件：`data/accounts/<账户>/works/<作品>/chapters/<章节>.md`
- 作品结构化数据：同目录 `project.json`（大纲、人物、地点、装备、世界设定、关系、灵感、章节引用三数组）
- 账户与共享设定：`account.json` / `library.json`；AI 密钥 AES-256-GCM 加密存 `account.json`，主密钥在 `data/master.key`
- 会话：`data/sessions.json`，7 天过期

## API 摘要

统一信封：成功 `{code:200,data}`，失败 `{code,message,details}`。当前版本为 `/api/v1`，旧 `/api` 路径保留兼容。

| 路由 | 说明 |
|---|---|
| GET /api/v1/health | 健康检查、进程与 API 版本 |
| POST /api/v1/auth/register、login、logout | 账户与会话 |
| GET /api/v1/auth/me | 当前账户 |
| GET /api/v1/account | 登录引导载荷（账户、共享设定、作品、正文、`revision`） |
| PUT /api/v1/account/profile | 保存作者笔名（账户级，最多 24 个字符） |
| GET/PUT/DELETE /api/v1/works/:id | 单部作品资源；PUT 可携带正文，DELETE 删除作品 |
| PUT/DELETE /api/v1/works/:id/chapters/:chapterId | 单章正文资源写入与删除 |
| GET/PUT /api/v1/library | 账户共享设定库资源 |
| GET/PUT /api/v1/ai/settings | AI 配置（密钥脱敏返回） |
| POST /api/v1/ai/test | 连接测试（6 秒超时） |
| POST /api/v1/ai/run | AI 代理，接收 `{action, context}`；未配置时返回 `{mock:true}` 走前端离线模拟 |
| GET /shared/contracts.js | 前后端共享契约 |
| GET /shared/ai-actions.js | 共享 AI 指令注册表 |

除 `GET /account` 外，所有写入均为资源级请求并携带当前 `revision`；服务端递增版本，过期版本返回 `409`。

## AI 规则

- AI 只产出候选：结果卡片列出上下文清单，点"采纳"才写入数据
- 指令、标签、系统提示词与消息模板由 `shared/ai-actions.js` 统一维护；前端只组装结构化上下文
- 未配置访问地址或密钥时使用离线模拟，界面明确标注"模拟结果"
- 密钥本地加密保存，备份与接口返回均脱敏

## 门禁与回归

```bash
node scripts/verify.mjs
```

覆盖：API v1 与共享契约、认证限流、账户隔离、作品/章节/共享库资源写入与版本冲突、正文 md 落盘与回读、AI 设置脱敏与 mock 降级、会话失效、排版预览与标点校正分离、前端模块零循环、传输层与会话用例分离，以及分模块后的目录结构与源码不变式。

浏览器全功能回归基线见《docs/规范/龙吟写作项目规范与原则.html》第 7 节。

## 规范

工程规则唯一入口：`docs/规范/龙吟写作项目规范与原则.html`。冲突处置、偏离登记、各层规范均以该文件为准。
