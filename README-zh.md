# 🦞 OpenClaw — 个人 AI 助手

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.svg">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.svg" alt="OpenClaw" width="500">
    </picture>
</p>

<p align="center">
  <strong>EXFOLIATE! EXFOLIATE!</strong>
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/openclaw/openclaw/ci.yml?branch=main&style=for-the-badge" alt="CI 状态"></a>
  <a href="https://github.com/openclaw/openclaw/releases"><img src="https://img.shields.io/github/v/release/openclaw/openclaw?include_prereleases&style=for-the-badge" alt="GitHub 发布版本"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT 许可证"></a>
</p>

**OpenClaw** 是一款运行在你自己设备上的*个人 AI 助手*。
它在你常用的渠道中回复你（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、BlueBubbles、IRC、Microsoft Teams、Matrix、飞书、LINE、Mattermost、Nextcloud Talk、Nostr、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal、WebChat）。它支持在 macOS/iOS/Android 上进行语音输入和输出，并可渲染由你控制的实时 Canvas。Gateway 只是控制平面——产品本身是助手。

如果你想要一个感觉本地化、快速、常驻运行的个人单用户助手，就是它了。

[官网](https://openclaw.ai) · [文档](https://docs.openclaw.ai) · [愿景](VISION.zh-CN.md) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [入门指南](https://docs.openclaw.ai/start/getting-started) · [更新说明](https://docs.openclaw.ai/install/updating) · [展示](https://docs.openclaw.ai/start/showcase) · [常见问题](https://docs.openclaw.ai/help/faq) · [配置向导](https://docs.openclaw.ai/start/wizard) · [Nix](https://github.com/openclaw/nix-openclaw) · [Docker](https://docs.openclaw.ai/install/docker) · [Discord](https://discord.gg/clawd)

推荐安装方式：在终端中运行 `openclaw onboard`。
OpenClaw Onboard 会逐步引导你设置 Gateway、工作区、渠道和技能。这是推荐的 CLI 安装路径，支持 **macOS、Linux 和 Windows（经由 WSL2；强烈推荐）**。
兼容 npm、pnpm 或 bun。
新安装？从这里开始：[入门指南](https://docs.openclaw.ai/start/getting-started)

## 赞助商

| OpenAI                                                            | Vercel                                                            | Blacksmith                                                                   | Convex                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [![OpenAI](docs/assets/sponsors/openai.svg)](https://openai.com/) | [![Vercel](docs/assets/sponsors/vercel.svg)](https://vercel.com/) | [![Blacksmith](docs/assets/sponsors/blacksmith.svg)](https://blacksmith.sh/) | [![Convex](docs/assets/sponsors/convex.svg)](https://www.convex.dev/) |

**订阅 (OAuth)：**

- **[OpenAI](https://openai.com/)** (ChatGPT/Codex)

模型说明：虽然支持众多提供商和模型，但为了最佳体验和降低提示注入风险，请使用你能用的最强最新一代模型。参见 [配置向导](https://docs.openclaw.ai/start/onboarding)。

## 模型（选择与认证）

- 模型配置与 CLI：[模型](https://docs.openclaw.ai/concepts/models)
- 认证配置切换（OAuth 与 API 密钥）+ 故障转移：[模型故障转移](https://docs.openclaw.ai/concepts/model-failover)

## 安装（推荐）

运行环境：**Node 24（推荐）或 Node 22.16+**。

```bash
npm install -g openclaw@latest
# 或：pnpm add -g openclaw@latest

openclaw onboard --install-daemon
```

OpenClaw Onboard 会安装 Gateway 守护进程（launchd/systemd 用户服务），使其持续运行。

## 快速开始（TL;DR）

运行环境：**Node 24（推荐）或 Node 22.16+**。

完整新手指南（认证、配对、渠道）：[入门指南](https://docs.openclaw.ai/start/getting-started)

```bash
openclaw onboard --install-daemon

openclaw gateway --port 18789 --verbose

# 发送消息
openclaw message send --to +1234567890 --message "Hello from OpenClaw"

# 与助手对话（可选地将回复推送到任意已连接渠道：WhatsApp/Telegram/Slack/Discord/Google Chat/Signal/iMessage/BlueBubbles/IRC/Microsoft Teams/Matrix/飞书/LINE/Mattermost/Nextcloud Talk/Nostr/Synology Chat/Tlon/Twitch/Zalo/Zalo Personal/WebChat）
openclaw agent --message "Ship checklist" --thinking high
```

升级？参见 [更新指南](https://docs.openclaw.ai/install/updating)（并运行 `openclaw doctor`）。

## 开发渠道

- **stable**：正式发布版本（`vYYYY.M.D` 或 `vYYYY.M.D-<patch>`），npm dist-tag `latest`
- **beta**：预发布标签（`vYYYY.M.D-beta.N`），npm dist-tag `beta`（macOS 应用可能缺失）
- **dev**：`main` 分支最新提交，npm dist-tag `dev`（发布时）

切换渠道（git + npm）：`openclaw update --channel stable|beta|dev`
详情：[开发渠道](https://docs.openclaw.ai/install/development-channels)

## 从源码安装（开发）

从源码构建推荐使用 `pnpm`。Bun 可用于直接运行 TypeScript。

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install
pnpm ui:build # 首次运行会自动安装 UI 依赖
pnpm build

pnpm openclaw onboard --install-daemon

# 开发循环（源码/配置变更时自动重载）
pnpm gateway:watch
```

注意：`pnpm openclaw ...` 直接运行 TypeScript（通过 `tsx`）。`pnpm build` 会生成 `dist/`，用于通过 Node 或打包后的 `openclaw` 二进制运行。

## 安全默认（私信访问）

OpenClaw 连接真实的消息渠道。请将收到的私信视为**不可信输入**。

完整安全指南：[安全](https://docs.openclaw.ai/gateway/security)

Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack 上的默认行为：

- **私信配对**（`dmPolicy="pairing"` / `channels.discord.dmPolicy="pairing"` / `channels.slack.dmPolicy="pairing"`；旧版：`channels.discord.dm.policy`、`channels.slack.dm.policy`）：未知发送者会收到简短的配对码，机器人不会处理其消息
- 通过以下命令批准：`openclaw pairing approve <channel> <code>`（随后发送者会被加入本地白名单存储）
- 公开接收私信需要显式选择：设置 `dmPolicy="open"` 并在渠道白名单中包含 `"*"`（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`；旧版：`channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）

运行 `openclaw doctor` 可发现存在风险的或配置不当的私信策略。

## 亮点

- **[本地优先 Gateway](https://docs.openclaw.ai/gateway)** — 会话、渠道、工具和事件的单一控制平面
- **[多渠道收件箱](https://docs.openclaw.ai/channels)** — WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、BlueBubbles（iMessage）、iMessage（传统）、IRC、Microsoft Teams、Matrix、飞书、LINE、Mattermost、Nextcloud Talk、Nostr、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal、WebChat、macOS、iOS/Android
- **[多 Agent 路由](https://docs.openclaw.ai/gateway/configuration)** — 将入站渠道/账号/对等方路由到隔离的 Agent（工作区 + 每个 Agent 的会话）
- **[语音唤醒](https://docs.openclaw.ai/nodes/voicewake) + [对话模式](https://docs.openclaw.ai/nodes/talk)** — macOS/iOS 上的唤醒词以及 Android 上的持续语音（ElevenLabs + 系统 TTS 回退）
- **[实时 Canvas](https://docs.openclaw.ai/platforms/mac/canvas)** — 由 Agent 驱动的可视化工作区，支持 [A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui)
- **[原生工具支持](https://docs.openclaw.ai/tools)** — 浏览器、Canvas、节点、定时任务、会话，以及 Discord/Slack 操作
- **[配套应用](https://docs.openclaw.ai/platforms/macos)** — macOS 菜单栏应用 + iOS/Android [节点](https://docs.openclaw.ai/nodes)
- **[配置向导](https://docs.openclaw.ai/start/wizard) + [技能](https://docs.openclaw.ai/tools/skills)** — 向导式设置，支持内置/托管/工作区技能

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=openclaw/openclaw&type=date&legend=top-left)](https://www.star-history.com/#openclaw/openclaw&type=date&legend=top-left)

## 我们至今构建的内容

### 核心平台

- [Gateway WebSocket 控制平面](https://docs.openclaw.ai/gateway)，包含会话、在线状态、配置、定时任务、Webhook、[控制 UI](https://docs.openclaw.ai/web) 和 [Canvas 宿主](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui)
- [CLI 界面](https://docs.openclaw.ai/tools/agent-send)：gateway、agent、send、[配置向导](https://docs.openclaw.ai/start/wizard)、[doctor](https://docs.openclaw.ai/gateway/doctor)
- [Pi Agent 运行时](https://docs.openclaw.ai/concepts/agent)，RPC 模式，支持工具流和块流
- [会话模型](https://docs.openclaw.ai/concepts/session)：`main` 用于直接对话、群组隔离、激活模式、队列模式、回复回传。群组规则：[群组](https://docs.openclaw.ai/channels/groups)
- [媒体流水线](https://docs.openclaw.ai/nodes/images)：图片/音频/视频、转写钩子、大小限制、临时文件生命周期。音频详情：[音频](https://docs.openclaw.ai/nodes/audio)

### 渠道

- [渠道](https://docs.openclaw.ai/channels)：[WhatsApp](https://docs.openclaw.ai/channels/whatsapp) (Baileys)、[Telegram](https://docs.openclaw.ai/channels/telegram) (grammY)、[Slack](https://docs.openclaw.ai/channels/slack) (Bolt)、[Discord](https://docs.openclaw.ai/channels/discord) (discord.js)、[Google Chat](https://docs.openclaw.ai/channels/googlechat) (Chat API)、[Signal](https://docs.openclaw.ai/channels/signal) (signal-cli)、[BlueBubbles](https://docs.openclaw.ai/channels/bluebubbles) (iMessage，推荐)、[iMessage](https://docs.openclaw.ai/channels/imessage) (传统 imsg)、[IRC](https://docs.openclaw.ai/channels/irc)、[Microsoft Teams](https://docs.openclaw.ai/channels/msteams)、[Matrix](https://docs.openclaw.ai/channels/matrix)、[飞书](https://docs.openclaw.ai/channels/feishu)、[LINE](https://docs.openclaw.ai/channels/line)、[Mattermost](https://docs.openclaw.ai/channels/mattermost)、[Nextcloud Talk](https://docs.openclaw.ai/channels/nextcloud-talk)、[Nostr](https://docs.openclaw.ai/channels/nostr)、[Synology Chat](https://docs.openclaw.ai/channels/synology-chat)、[Tlon](https://docs.openclaw.ai/channels/tlon)、[Twitch](https://docs.openclaw.ai/channels/twitch)、[Zalo](https://docs.openclaw.ai/channels/zalo)、[Zalo Personal](https://docs.openclaw.ai/channels/zalouser)、[WebChat](https://docs.openclaw.ai/web/webchat)
- [群组路由](https://docs.openclaw.ai/channels/group-messages)：@ 提及门控、回复标签、每渠道分块与路由。渠道规则：[渠道](https://docs.openclaw.ai/channels)

### 应用与节点

- [macOS 应用](https://docs.openclaw.ai/platforms/macos)：菜单栏控制平面、[语音唤醒](https://docs.openclaw.ai/nodes/voicewake)/PTT、[对话模式](https://docs.openclaw.ai/nodes/talk) 悬浮窗、[WebChat](https://docs.openclaw.ai/web/webchat)、调试工具、[远程 Gateway](https://docs.openclaw.ai/gateway/remote) 控制
- [iOS 节点](https://docs.openclaw.ai/platforms/ios)：[Canvas](https://docs.openclaw.ai/platforms/mac/canvas)、[语音唤醒](https://docs.openclaw.ai/nodes/voicewake)、[对话模式](https://docs.openclaw.ai/nodes/talk)、摄像头、屏幕录制、Bonjour + 设备配对
- [Android 节点](https://docs.openclaw.ai/platforms/android)：连接标签（设置码/手动）、聊天会话、语音标签、[Canvas](https://docs.openclaw.ai/platforms/mac/canvas)、摄像头/屏幕录制，以及 Android 设备命令（通知/位置/短信/照片/联系人/日历/ motion/应用更新）
- [macOS 节点模式](https://docs.openclaw.ai/nodes)：system.run/notify + canvas/摄像头暴露

### 工具与自动化

- [浏览器控制](https://docs.openclaw.ai/tools/browser)：专用 openclaw Chrome/Chromium、截图、操作、上传、配置文件
- [Canvas](https://docs.openclaw.ai/platforms/mac/canvas)：[A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui) 推送/重置、eval、快照
- [节点](https://docs.openclaw.ai/nodes)：摄像头快照/片段、屏幕录制、[location.get](https://docs.openclaw.ai/nodes/location-command)、通知
- [定时任务 + 唤醒](https://docs.openclaw.ai/automation/cron-jobs)；[Webhook](https://docs.openclaw.ai/automation/webhook)；[Gmail Pub/Sub](https://docs.openclaw.ai/automation/gmail-pubsub)
- [技能平台](https://docs.openclaw.ai/tools/skills)：内置、托管和工作区技能，支持安装门控 + UI

### 运行时与安全

- [渠道路由](https://docs.openclaw.ai/channels/channel-routing)、[重试策略](https://docs.openclaw.ai/concepts/retry)、[流式/分块](https://docs.openclaw.ai/concepts/streaming)
- [在线状态](https://docs.openclaw.ai/concepts/presence)、[输入中指示器](https://docs.openclaw.ai/concepts/typing-indicators)、[使用量追踪](https://docs.openclaw.ai/concepts/usage-tracking)
- [模型](https://docs.openclaw.ai/concepts/models)、[模型故障转移](https://docs.openclaw.ai/concepts/model-failover)、[会话修剪](https://docs.openclaw.ai/concepts/session-pruning)
- [安全](https://docs.openclaw.ai/gateway/security) 与 [故障排除](https://docs.openclaw.ai/channels/troubleshooting)

### 运维与打包

- [控制 UI](https://docs.openclaw.ai/web) + [WebChat](https://docs.openclaw.ai/web/webchat) 直接从 Gateway 提供
- [Tailscale Serve/Funnel](https://docs.openclaw.ai/gateway/tailscale) 或 [SSH 隧道](https://docs.openclaw.ai/gateway/remote)，支持 token/密码认证
- [Nix 模式](https://docs.openclaw.ai/install/nix) 用于声明式配置；基于 [Docker](https://docs.openclaw.ai/install/docker) 的安装
- [Doctor](https://docs.openclaw.ai/gateway/doctor) 迁移、[日志](https://docs.openclaw.ai/logging)

## 工作原理（简述）

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / BlueBubbles / IRC / Microsoft Teams / Matrix / 飞书 / LINE / Mattermost / Nextcloud Talk / Nostr / Synology Chat / Tlon / Twitch / Zalo / Zalo Personal / WebChat
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       （控制平面）              │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Pi agent (RPC)
               ├─ CLI (openclaw …)
               ├─ WebChat UI
               ├─ macOS app
               └─ iOS / Android 节点
```

## 核心子系统

- **[Gateway WebSocket 网络](https://docs.openclaw.ai/concepts/architecture)** — 客户端、工具和事件的单一 WS 控制平面（运维：[Gateway 操作手册](https://docs.openclaw.ai/gateway)）
- **[Tailscale 暴露](https://docs.openclaw.ai/gateway/tailscale)** — Gateway 仪表盘 + WS 的 Serve/Funnel（远程访问：[远程](https://docs.openclaw.ai/gateway/remote)）
- **[浏览器控制](https://docs.openclaw.ai/tools/browser)** — 由 openclaw 管理的 Chrome/Chromium，支持 CDP 控制
- **[Canvas + A2UI](https://docs.openclaw.ai/platforms/mac/canvas)** — 由 Agent 驱动的可视化工作区（A2UI 宿主：[Canvas/A2UI](https://docs.openclaw.ai/platforms/mac/canvas#canvas-a2ui)）
- **[语音唤醒](https://docs.openclaw.ai/nodes/voicewake) + [对话模式](https://docs.openclaw.ai/nodes/talk)** — macOS/iOS 上的唤醒词，以及 Android 上的持续语音
- **[节点](https://docs.openclaw.ai/nodes)** — Canvas、摄像头快照/片段、屏幕录制、`location.get`、通知，以及仅 macOS 支持的 `system.run`/`system.notify`

## Tailscale 访问（Gateway 仪表盘）

OpenClaw 可以在 Gateway 绑定到 loopback 时，自动配置 Tailscale **Serve**（仅尾网）或 **Funnel**（公网）。配置 `gateway.tailscale.mode`：

- `off`：无 Tailscale 自动化（默认）
- `serve`：通过 `tailscale serve` 的仅尾网 HTTPS（默认使用 Tailscale 身份头）
- `funnel`：通过 `tailscale funnel` 的公网 HTTPS（需要共享密码认证）

说明：

- 启用 Serve/Funnel 时，`gateway.bind` 必须保持为 `loopback`（OpenClaw 会强制此要求）
- 可通过设置 `gateway.auth.mode: "password"` 或 `gateway.auth.allowTailscale: false` 强制 Serve 需要密码
- Funnel 除非设置 `gateway.auth.mode: "password"` 否则拒绝启动
- 可选：`gateway.tailscale.resetOnExit` 在退出时撤销 Serve/Funnel

详情：[Tailscale 指南](https://docs.openclaw.ai/gateway/tailscale) · [Web 界面](https://docs.openclaw.ai/web)

## 远程 Gateway（Linux 很合适）

在小型 Linux 实例上运行 Gateway 完全没问题。客户端（macOS 应用、CLI、WebChat）可通过 **Tailscale Serve/Funnel** 或 **SSH 隧道**连接，你仍然可以配对接入设备节点（macOS/iOS/Android）以在需要时执行设备本地操作。

- **Gateway 主机**默认运行执行工具和渠道连接
- **设备节点**通过 `node.invoke` 运行设备本地操作（`system.run`、摄像头、屏幕录制、通知）
  简言之：执行在 Gateway 所在处运行；设备操作在设备所在处运行

详情：[远程访问](https://docs.openclaw.ai/gateway/remote) · [节点](https://docs.openclaw.ai/nodes) · [安全](https://docs.openclaw.ai/gateway/security)

## 通过 Gateway 协议的 macOS 权限

macOS 应用可以以**节点模式**运行，并通过 Gateway WebSocket（`node.list` / `node.describe`）公布其能力与权限映射。客户端随后可通过 `node.invoke` 执行本地操作：

- `system.run` 运行本地命令并返回 stdout/stderr/退出码；设置 `needsScreenRecording: true` 以要求屏幕录制权限（否则会得到 `PERMISSION_MISSING`）
- `system.notify` 发送用户通知，若通知被拒绝则失败
- `canvas.*`、`camera.*`、`screen.record` 和 `location.get` 也通过 `node.invoke` 路由，并遵循 TCC 权限状态

提升的 bash（主机权限）与 macOS TCC 是分开的：

- 当启用且白名单允许时，使用 `/elevated on|off` 按会话切换提升访问
- Gateway 通过 `sessions.patch`（WS 方法）持久化每个会话的开关，同时包括 `thinkingLevel`、`verboseLevel`、`model`、`sendPolicy` 和 `groupActivation`

详情：[节点](https://docs.openclaw.ai/nodes) · [macOS 应用](https://docs.openclaw.ai/platforms/macos) · [Gateway 协议](https://docs.openclaw.ai/concepts/architecture)

## Agent 间通信（sessions\_\* 工具）

- 用于在不切换聊天界面的情况下跨会话协调工作
- `sessions_list` — 发现活跃会话（Agent）及其元数据
- `sessions_history` — 获取会话的对话记录
- `sessions_send` — 向另一会话发消息；可选的回复乒乓 + 公告步骤（`REPLY_SKIP`、`ANNOUNCE_SKIP`）

详情：[会话工具](https://docs.openclaw.ai/concepts/session-tool)

## 技能注册表（ClawHub）

ClawHub 是一个轻量级技能注册表。启用 ClawHub 后，Agent 可以自动搜索技能并在需要时拉取新技能。

[ClawHub](https://clawhub.com)

## 聊天命令

在 WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat 中发送（群组命令仅限群主）：

- `/status` — 简明会话状态（模型 + token、可用时显示成本）
- `/new` 或 `/reset` — 重置会话
- `/compact` — 压缩会话上下文（摘要）
- `/think <level>` — off|minimal|low|medium|high|xhigh（仅限 GPT-5.2 + Codex 模型）
- `/verbose on|off`
- `/usage off|tokens|full` — 每次回复的使用量页脚
- `/restart` — 重启 Gateway（群组中仅群主）
- `/activation mention|always` — 群组激活切换（仅群组）

## 应用（可选）

仅 Gateway 就能提供良好体验。所有应用都是可选的，用于提供额外功能。

如果你打算构建或运行配套应用，请参考以下平台操作手册。

### macOS (OpenClaw.app)（可选）

- 菜单栏控制 Gateway 和健康状态
- 语音唤醒 + 按住说话悬浮窗
- WebChat + 调试工具
- 通过 SSH 的远程 Gateway 控制

注意：macOS 权限需要在重建后生效，需要签名构建（参见 [macOS 权限](https://docs.openclaw.ai/platforms/mac/permissions)）。

### iOS 节点（可选）

- 通过 Gateway WebSocket 配对为节点（设备配对）
- 语音触发转发 + Canvas 界面
- 通过 `openclaw nodes …` 控制

操作手册：[iOS 连接](https://docs.openclaw.ai/platforms/ios)

### Android 节点（可选）

- 通过设备配对作为 WS 节点配对（`openclaw devices ...`）
- 提供连接/聊天/语音标签，以及 Canvas、摄像头、屏幕捕获和 Android 设备命令族
- 操作手册：[Android 连接](https://docs.openclaw.ai/platforms/android)

## Agent 工作区与技能

- 工作区根目录：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）
- 注入的提示文件：`AGENTS.md`、`SOUL.md`、`TOOLS.md`
- 技能：`~/.openclaw/workspace/skills/<skill>/SKILL.md`

## 配置

最简 `~/.openclaw/openclaw.json`（模型 + 默认值）：

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
}
```

[完整配置参考（所有键 + 示例）](https://docs.openclaw.ai/gateway/configuration)

## 安全模型（重要）

- **默认**：工具在主机上为 **main** 会话运行，因此当你独自使用时 Agent 拥有完整访问权限
- **群组/渠道安全**：设置 `agents.defaults.sandbox.mode: "non-main"` 可在每个会话的 Docker 沙箱内运行**非 main 会话**（群组/渠道）；这些会话的 bash 会在 Docker 中运行
- **沙箱默认**：白名单 `bash`、`process`、`read`、`write`、`edit`、`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`；黑名单 `browser`、`canvas`、`nodes`、`cron`、`discord`、`gateway`

详情：[安全指南](https://docs.openclaw.ai/gateway/security) · [Docker + 沙箱](https://docs.openclaw.ai/install/docker) · [沙箱配置](https://docs.openclaw.ai/gateway/configuration)

### [WhatsApp](https://docs.openclaw.ai/channels/whatsapp)

- 连接设备：`pnpm openclaw channels login`（凭据存储在 `~/.openclaw/credentials`）
- 通过 `channels.whatsapp.allowFrom` 白名单可与此助手对话的人
- 若设置 `channels.whatsapp.groups`，则成为群组白名单；包含 `"*"` 以允许所有群组

### [Telegram](https://docs.openclaw.ai/channels/telegram)

- 设置 `TELEGRAM_BOT_TOKEN` 或 `channels.telegram.botToken`（环境变量优先）
- 可选：设置 `channels.telegram.groups`（配合 `channels.telegram.groups."*".requireMention`）；设置后为群组白名单（包含 `"*"` 以允许所有）。也可根据需要配置 `channels.telegram.allowFrom` 或 `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret`

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
    },
  },
}
```

### [Slack](https://docs.openclaw.ai/channels/slack)

- 设置 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`（或 `channels.slack.botToken` + `channels.slack.appToken`）

### [Discord](https://docs.openclaw.ai/channels/discord)

- 设置 `DISCORD_BOT_TOKEN` 或 `channels.discord.token`
- 可选：根据需要设置 `commands.native`、`commands.text` 或 `commands.useAccessGroups`，以及 `channels.discord.allowFrom`、`channels.discord.guilds` 或 `channels.discord.mediaMaxMb`

```json5
{
  channels: {
    discord: {
      token: "1234abcd",
    },
  },
}
```

### [Signal](https://docs.openclaw.ai/channels/signal)

- 需要 `signal-cli` 和 `channels.signal` 配置节

### [BlueBubbles (iMessage)](https://docs.openclaw.ai/channels/bluebubbles)

- **推荐** 的 iMessage 集成
- 配置 `channels.bluebubbles.serverUrl` + `channels.bluebubbles.password` 和 Webhook（`channels.bluebubbles.webhookPath`）
- BlueBubbles 服务器运行在 macOS 上；Gateway 可运行在 macOS 或别处

### [iMessage (传统)](https://docs.openclaw.ai/channels/imessage)

- 通过 `imsg` 的传统仅 macOS 集成（Messages 必须已登录）
- 若设置 `channels.imessage.groups`，则成为群组白名单；包含 `"*"` 以允许所有群组

### [Microsoft Teams](https://docs.openclaw.ai/channels/msteams)

- 配置 Teams 应用 + Bot Framework，然后添加 `msteams` 配置节
- 通过 `msteams.allowFrom` 白名单可对话的人；群组访问通过 `msteams.groupAllowFrom` 或 `msteams.groupPolicy: "open"`

### [WebChat](https://docs.openclaw.ai/web/webchat)

- 使用 Gateway WebSocket；无需单独的 WebChat 端口/配置

浏览器控制（可选）：

```json5
{
  browser: {
    enabled: true,
    color: "#FF4500",
  },
}
```

## 文档

当你完成配置向导并需要更深入的参考时，可使用以下资源。

- [从文档索引开始，了解导航和「内容在哪」](https://docs.openclaw.ai)
- [阅读 Gateway + 协议模型的架构概览](https://docs.openclaw.ai/concepts/architecture)
- [需要每个配置键和示例时，使用完整配置参考](https://docs.openclaw.ai/gateway/configuration)
- [按照操作手册运行 Gateway](https://docs.openclaw.ai/gateway)
- [了解控制 UI/Web 界面的工作方式以及如何安全暴露](https://docs.openclaw.ai/web)
- [理解通过 SSH 隧道或尾网进行的远程访问](https://docs.openclaw.ai/gateway/remote)
- [遵循 OpenClaw Onboard 进行引导式设置](https://docs.openclaw.ai/start/wizard)
- [通过 Webhook 界面连接外部触发器](https://docs.openclaw.ai/automation/webhook)
- [配置 Gmail Pub/Sub 触发器](https://docs.openclaw.ai/automation/gmail-pubsub)
- [了解 macOS 菜单栏配套应用详情](https://docs.openclaw.ai/platforms/mac/menu-bar)
- 平台指南：[Windows (WSL2)](https://docs.openclaw.ai/platforms/windows)、[Linux](https://docs.openclaw.ai/platforms/linux)、[macOS](https://docs.openclaw.ai/platforms/macos)、[iOS](https://docs.openclaw.ai/platforms/ios)、[Android](https://docs.openclaw.ai/platforms/android)
- [使用故障排除指南调试常见失败](https://docs.openclaw.ai/channels/troubleshooting)
- [在暴露任何内容之前查阅安全指南](https://docs.openclaw.ai/gateway/security)

## 进阶文档（发现与控制）

- [发现与传输](https://docs.openclaw.ai/gateway/discovery)
- [Bonjour/mDNS](https://docs.openclaw.ai/gateway/bonjour)
- [Gateway 配对](https://docs.openclaw.ai/gateway/pairing)
- [远程 Gateway README](https://docs.openclaw.ai/gateway/remote-gateway-readme)
- [控制 UI](https://docs.openclaw.ai/web/control-ui)
- [仪表盘](https://docs.openclaw.ai/web/dashboard)

## 运维与故障排除

- [健康检查](https://docs.openclaw.ai/gateway/health)
- [Gateway 锁](https://docs.openclaw.ai/gateway/gateway-lock)
- [后台进程](https://docs.openclaw.ai/gateway/background-process)
- [浏览器故障排除 (Linux)](https://docs.openclaw.ai/tools/browser-linux-troubleshooting)
- [日志](https://docs.openclaw.ai/logging)

## 深入理解

- [Agent 循环](https://docs.openclaw.ai/concepts/agent-loop)
- [在线状态](https://docs.openclaw.ai/concepts/presence)
- [TypeBox 模式](https://docs.openclaw.ai/concepts/typebox)
- [RPC 适配器](https://docs.openclaw.ai/reference/rpc)
- [队列](https://docs.openclaw.ai/concepts/queue)

## 工作区与技能

- [技能配置](https://docs.openclaw.ai/tools/skills-config)
- [默认 AGENTS](https://docs.openclaw.ai/reference/AGENTS.default)
- 模板：[AGENTS](https://docs.openclaw.ai/reference/templates/AGENTS)、[BOOTSTRAP](https://docs.openclaw.ai/reference/templates/BOOTSTRAP)、[IDENTITY](https://docs.openclaw.ai/reference/templates/IDENTITY)、[SOUL](https://docs.openclaw.ai/reference/templates/SOUL)、[TOOLS](https://docs.openclaw.ai/reference/templates/TOOLS)、[USER](https://docs.openclaw.ai/reference/templates/USER)

## 平台内部

- [macOS 开发设置](https://docs.openclaw.ai/platforms/mac/dev-setup)
- [macOS 菜单栏](https://docs.openclaw.ai/platforms/mac/menu-bar)
- [macOS 语音唤醒](https://docs.openclaw.ai/platforms/mac/voicewake)
- [iOS 节点](https://docs.openclaw.ai/platforms/ios)
- [Android 节点](https://docs.openclaw.ai/platforms/android)
- [Windows (WSL2)](https://docs.openclaw.ai/platforms/windows)
- [Linux 应用](https://docs.openclaw.ai/platforms/linux)

## 邮件钩子（Gmail）

- [docs.openclaw.ai/gmail-pubsub](https://docs.openclaw.ai/automation/gmail-pubsub)

## Molty

OpenClaw 为 **Molty** 打造——一只太空龙虾 AI 助手。🦞
由 Peter Steinberger 和社区共同打造。

- [openclaw.ai](https://openclaw.ai)
- [soul.md](https://soul.md)
- [steipete.me](https://steipete.me)
- [@openclaw](https://x.com/openclaw)

## 社区

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南、维护者以及如何提交 PR。
欢迎 AI/vibe 编码的 PR！🤖

特别感谢 [Mario Zechner](https://mariozechner.at/) 的支持以及 [pi-mono](https://github.com/badlogic/pi-mono)。
特别感谢 Adam Doppelt 的 lobster.bot。

感谢所有贡献者！完整列表请参见 [README.md](README.md)。
