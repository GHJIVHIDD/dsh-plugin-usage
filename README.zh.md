# dsh-plugin-usage（用量）

> 面向 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness)（DSH）的部署级 **用量** 插件。

在会话视图环中（「对话 / 轨迹」之后）新增「用量」页签：实时记录当前会话的输入、输出、缓存命中 tokens，并按 **DeepSeek 官方峰谷价** 与 **OpenCode Go 套餐价** 双计价；每秒自动刷新，动态渐变蓝色状态条，支持 **自定义价格表**（重启后保留）与 **CSV/JSON 导出**。

> English documentation: [README.md](README.md)

---

## ✨ 功能特性

- **会话视图环新增「用量」页签**：紧随「轨迹」之后（`order: 11`），原生 DSH UI 风格（主题变量、紧凑工具栏、卡片分区）。
- **实时流式跟踪**：包装每一次 `llm/stream` 模型调用——调用一开始即出现「生成中」记录，输出/思考 tokens 逐 chunk 实时估算、每秒更新，随后被适配器上报的精确 usage 替换；消息提交时按 15 秒窗口定稿对账，不重复计数。
- **会话级记账**：输入（缓存未命中）、输出（含思考）、缓存命中、缓存写入；汇总与逐条明细（含时间戳）。
- **历史预载**：首次打开会话时，从持久化会话日志重建完整历史用量（与实时采集按 seq 双向去重）。
- **双计价、自动判定**：每条调用按其自身时间计价——
  - **DeepSeek 官方价**（¥/百万 tokens，2026-08-17 起）：高峰时段（北京时间 9:00–12:00、14:00–18:00）为 2 倍价。V4 Pro：高峰 9/0.3/27，空闲 4.5/0.15/13.5（输入/命中/输出）；V4 Flash：高峰 3/0.1/9，空闲 1.5/0.05/4.5。
  - **OpenCode Go 套餐价**（$/百万 tokens + 月额度）：内置 20 个模型（DeepSeek V4 Pro/Flash、Grok 4.5、GPT 5.6 Luna、GLM、Kimi、MiMo、MiniMax、Qwen3、Hy3 等），如 V4 Flash 0.14/0.0028/0.28、月额度 $60；套餐 $10/月 ≈ 6 倍额度价值。
  - 三种显示模式：**自动**（双价同显）、**仅官方**、**仅套餐**。
- **动态渐变蓝色状态条**：输入 / 输出 / 命中分布 + 套餐额度占用，宽度平滑过渡，每秒刷新。
- **自定义价格表**：任意模型可新增、编辑、移除价格（官方高峰/空闲 + 套餐价 + 额度）。自定义项覆盖内置价目并持久化到 `<workspaceRoot>/.dsh-usage-prices.json`；修改后**历史费用立即按新价格重算**。
- **CSV / JSON 导出**：一键生成下载链接（60 秒有效），包含逐条调用明细与总计。
- **高峰/空闲徽标**：工具栏实时显示当前北京时间所处时段。

---

## 🔐 隐私说明

- 不读取、不记录、不存储任何 API 密钥、凭据、令牌或本机专属路径；内存中仅保留用量数字。
- 自定义价格文件只保存价格数据（不含对话内容、token、密钥）。
- 插件不做任何外发：全部计算在本地完成；导出文件由本地 DSH HTTP 服务以一次性链接提供。

---

## 🚀 安装

> ⚠️ **重要：每个插件只注册一次，不要同时使用两条安装路径。**
>
> - `dsh plugin add`（方式 A / B）会把插件加入 `dsh.profile.bundles`，插件自带的 `cordis.patch.yml` 会作为 bundle 层自动生效，**不需要再手动往 `cordis.patch.yml` 里加 `ui-usage`**。
> - `./install.sh` 或手动 patch（方式 C / D）走 `cordis.patch.yml` 注册，**不要再用 `dsh plugin add`**。
> - 如果同时出现两份 `ui-usage`，DSH 会报 `duplicate loader entry id: ui-usage`。修复方式：二选一删除。`./install.sh` 已会自动从 `dsh.profile.bundles` 中移除本插件，避免重复。

### 前置条件

- 已安装 DeepSeek Harness，且 `web` profile 至少初始化过一次（运行过 `dsh web`），即存在 `~/.dsh/profiles/web`。

### 方式 A：从 GitHub 源码安装（推荐）

```bash
dsh plugin --profile web add github:GHJIVHIDD/dsh-plugin-usage
```

建议锁定 commit，避免后续推送改变实际安装的代码：

```bash
dsh plugin --profile web add github:GHJIVHIDD/dsh-plugin-usage#<commit-sha>
```

> **pnpm ≥ 10 构建授权**：如果第一次执行失败并提示 pnpm 拒绝运行 git 依赖的 `prepare` 脚本，请把以下内容加入该 profile 的 `pnpm-workspace.yaml`：

```yaml
# 文件位置：~/.dsh/profiles/web/pnpm-workspace.yaml
allowBuilds:
  "@deepseek-ai/dsh-plugin-usage": true
```

然后重新执行安装命令。

### 方式 B：从 GitHub Releases 下载安装包 / tarball

安装包发布在 GitHub Releases，不放入源码目录。直接下载：

```bash
curl -L -o dsh-plugin-usage-0.1.0.tgz \
  https://github.com/GHJIVHIDD/dsh-plugin-usage/releases/download/v0.1.0/dsh-plugin-usage-0.1.0.tgz

# 下载后安装
dsh plugin --profile web add ./dsh-plugin-usage-0.1.0.tgz
```

也可以打开 Releases 页面手动下载：

```text
https://github.com/GHJIVHIDD/dsh-plugin-usage/releases
```

或者使用本地源码目录：

```bash
dsh plugin --profile web add /path/to/dsh-plugin-usage
```

### 方式 C：免 pnpm 手动安装脚本

```bash
git clone https://github.com/GHJIVHIDD/dsh-plugin-usage.git
cd dsh-plugin-usage
./install.sh
```

脚本会将插件复制到 `~/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-plugin-usage`，自动把 `ui-usage` 补丁写入 `cordis.patch.yml`，并自动从 `dsh.profile.bundles` 中移除本插件（如有，且先备份为 `package.json.bak`），避免重复注册。可用环境变量指定位置：

```bash
DSH_HOME=/path/to/.dsh DSH_PROFILE=web ./install.sh
```

### 方式 D：手动复制 + patch

```bash
# 1. 复制插件包到 profile 的 node_modules
mkdir -p ~/.dsh/profiles/web/node_modules/@deepseek-ai
cp -R dsh-plugin-usage ~/.dsh/profiles/web/node_modules/@deepseek-ai/

# 2. 确认 ~/.dsh/profiles/web/cordis.patch.yml 中包含：
# - insert:
#     - id: ui-usage
#       name: '@deepseek-ai/dsh-plugin-usage'
```

### 验证安装

```bash
# profile 必须能无错误完成组合：
dsh --profile web --dump-config > /dev/null && echo OK
```

然后启动（或刷新）web profile，打开「用量」页签：

```bash
dsh web
```

如果页签未出现：打开浏览器控制台查看是否有 `usage-api` 请求失败；并确认补丁只存在一份（`grep -n ui-usage ~/.dsh/profiles/web/cordis.patch.yml ~/.dsh/profiles/web/package.json`）。

---

## 🧭 使用说明

1. 开始对话，让智能体运行（每次模型调用都会被跟踪）。
2. 打开「用量」页签（在「轨迹」旁边）。
3. 页面每秒自动刷新：
   - **会话概览**：输入（缓存未命中）/ 输出（含思考）/ 命中 / 费用（官方 ¥ 与套餐 $），当前模型与调用次数。
   - **用量分布**：输入、输出、命中、套餐额度四条渐变蓝色状态条；进行中的调用带脉冲圆点与「生成中」标记。
   - **调用明细**：时间、模型、输入/输出/命中 tokens、官方 ¥ 与套餐 $ 单价费用；进行中的行显示蓝色脉冲指示。
   - **价格表**（可折叠）：完整合并价目表；任意模型可「编辑」，可「+ 新增模型」，自定义项可「移除」。
4. **导出**：点击「调用明细」标题栏的「导出」按钮，下载 **CSV** 或 **JSON**（链接 60 秒有效；再次点击可重新生成）。
5. **计价模式**：工具栏切换「自动（双价）/ 官方 / 套餐」。

### 自定义价格表

- 单位：官方 ¥/百万 tokens（高峰与空闲两档），套餐 $/百万 tokens + 月额度。
- 字段留空表示不设置该价格项。
- 修改即时生效，整个会话历史按新价格重新计算（动态计价），并保存到 `<workspaceRoot>/.dsh-usage-prices.json`。
- 移除自定义项后自动回退内置价目。

### 高峰 / 空闲

高峰时段为 **北京时间 9:00–12:00 与 14:00–18:00**，官方价为 2 倍。工具栏徽标显示当前时段；每条调用按其自身时间计价，时段切换后历史数据依然准确。

---

## 🗂️ 包结构

```
dsh-plugin-usage/
├── package.json          # npm 包清单，含 dsh.bundle.patch 与 dsh.client 元数据
├── cordis.patch.yml      # loader 补丁：插入 ui-usage 条目
├── install.sh            # 免 pnpm 手动安装脚本（方式 C）
├── lib/
│   ├── index.js          # host 半部（ESM）：采集、计价、/usage-api/* 路由
│   ├── client.js         # client 半部（web ModuleLoader 打包格式）
│   └── types/index.d.ts  # TypeScript 类型声明
├── scripts/verify.mjs    # 结构与隐私校验脚本（开发期）
├── README.md             # 英文文档
├── README.zh.md          # 本文档（中文）
└── LICENSE               # MIT
```

### HTTP API（内部，同源）

| 路由 | 方法 | 用途 |
|---|---|---|
| `/usage-api/state?sessionId=` | GET | 会话用量汇总 + 逐条明细（每秒轮询） |
| `/usage-api/mode` | POST | 切换计价模式：`{ "mode": "auto" \| "official" \| "go" }` |
| `/usage-api/prices` | GET | 合并价格表（内置 + 自定义） |
| `/usage-api/setprice` | POST | 新增 / 编辑 / 移除自定义价格（持久化） |
| `/usage-api/export?sessionId=&format=csv\|json\|both` | GET | 生成一次性下载链接 |
| `/usage-export-<token>` | GET | 下载导出的 CSV/JSON（60 秒有效） |

---

## 🧩 兼容性

- 基于 DSH web profile（会话视图环 `conversation.view` slot）构建与测试。
- 打包约定与 `dsh-plugin-canvas` / `dsh-plugin-vm-sandbox` 一致（`dsh.bundle.patch` + `dsh.client` 元数据、`./client` 导出、loader 补丁）。
- 无外部运行时依赖；host 半部仅使用 DSH 核心服务（`webServer`、`timer`、`fs`、`sandboxPolicy`、`sessionQuery`、`llm/stream`、`session/event`）。

---

## ❓ 常见问题

**Q：页签显示「用量数据加载失败」。**
A：说明 host 半部没有正常提供 `/usage-api/*`。请确认插件只注册了一次（见安装说明），然后重启 profile；用 `dsh --profile web --dump-config` 检查输出中是否存在 `ui-usage` 行。

**Q：为什么修改价格后数字会变？**
A：费用在每次读取时按当前价格表动态计算，历史调用会立即按新价格重算。这是设计行为。

**Q：会话内容会被保存吗？**
A：不会。内存中只保留 token 数量、模型名与时间戳；导出内容同样只有这些数据。自定义价格文件只含价格。

**Q：可以在 headless profile 使用吗？**
A：UI 仅支持 web；host 半部可在任意 profile 工作，但仪表盘需要 web 客户端。

---

## 📄 许可证

[MIT](LICENSE) © 2026 GHJIVHIDD
