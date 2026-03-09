<div align="center">

# 🚀 OpenClaw Launcher

**One-click install, zero config — experience the power of AI coding instantly.**

[![GitHub Release](https://img.shields.io/github/v/release/ZsTs119/openclaw-launcher?style=flat-square&color=blue)](https://github.com/ZsTs119/openclaw-launcher/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ZsTs119/openclaw-launcher/build.yml?style=flat-square)](https://github.com/ZsTs119/openclaw-launcher/actions)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)]()

[Download](https://github.com/ZsTs119/openclaw-launcher/releases) · [Features](#-features) · [Quick Start](#-quick-start) · [Development](#-development) · [Contributing](#-contributing)

[🇨🇳 中文](README.md) | **English**

---

*OpenClaw Launcher lets anyone run the [OpenClaw](https://github.com/openclaw/openclaw) AI coding assistant locally — no programming experience required.*

</div>

## 📸 Screenshots

<div align="center">
<table>
<tr>
<td align="center"><strong>Dashboard — Ready</strong></td>
<td align="center"><strong>Dashboard — Running</strong></td>
</tr>
<tr>
<td><img src="docs/screenshot-dashboard.png" alt="Dashboard" width="400" /></td>
<td><img src="docs/screenshot-running.png" alt="Running" width="400" /></td>
</tr>
<tr>
<td align="center"><strong>Startup Overlay</strong></td>
<td align="center"><strong>AI Engine Config</strong></td>
</tr>
<tr>
<td><img src="docs/screenshot-startup.png" alt="Startup" width="400" /></td>
<td><img src="docs/screenshot-models.png" alt="Models" width="400" /></td>
</tr>
</table>
</div>

## ❓ Why a Launcher?

OpenClaw is a powerful AI coding framework, but for non-technical users, installing Node.js, setting environment variables, and running CLI commands is a huge barrier.

**OpenClaw Launcher removes all friction:**

| Before | After |
|---|---|
| Install Node.js → Configure PATH → Download source → npm install → Edit config → Start service | **Double-click Launcher → Click Start → Begin chatting** |

## ✨ Features

### 🎯 Core

- **🔧 Zero Environment Setup** — Auto-downloads portable Node.js, sandboxed in AppData
- **📦 One-Click Source Fetch** — Pulls latest OpenClaw from GitHub, auto-fallback to mirrors
- **📥 Smart Dependency Install** — Runs `npm install` with auto mirror switching
- **▶️ One-Click Start/Stop** — Desktop-grade controls, no terminal needed
- **🌐 Auto Browser Launch** — Opens web UI automatically when service is ready

### 🤖 AI Model Management

- **Multi-Provider** — Built-in support for Groq, SiliconFlow, OpenRouter, DeepSeek, OpenAI, and more
- **Free Models** — Recommended free-tier providers for zero-cost experience
- **Custom Relay Station** — Any OpenAI-compatible API (Base URL + Key)
- **Custom Model ID** — Manually enter any model ID for newly released models
- **One-Click Model Switch** — Switch default model without reconfiguration

### 🎨 Premium UI

- **Dark Theme** — Pure black background + frosted glass + gradient animations
- **Dashboard** — Brand logo with pulse glow + service status + uptime
- **Aurora Startup Screen** — Purple/cyan aurora drift + glowing progress bar
- **Startup Overlay** — Frosted glass overlay during service boot, auto-dismisses

### 🌐 Network Resilience (Optimized for China)

| Resource | Primary | Fallback |
|---|---|---|
| Node.js | `nodejs.org` | `npmmirror.com` |
| OpenClaw Source | `github.com` | `ghfast.top` / `ghproxy.com` |
| NPM Packages | `registry.npmjs.org` | `registry.npmmirror.com` |

All switching is **fully automatic** — 3-second timeout triggers fallback.

### 🛡️ Security

- **No UAC Prompts** — All operations within user AppData directory
- **No Antivirus Alerts** — Pure Rust native APIs, no `.bat` / `.ps1` scripts
- **Sandboxed** — Portable Node.js fully isolated from system environment

## 🖥️ Supported Platforms

| Platform | Architecture | Package Format |
|---|---|---|
| **Windows** | x64 | `.exe` / `.msi` |
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `.dmg` |
| **macOS** | Intel | `.dmg` |
| **Linux** | x64 | `.deb` / `.AppImage` |

## 🚀 Quick Start

### End Users

1. Download the installer from [Releases](https://github.com/ZsTs119/openclaw-launcher/releases)
2. Install and launch OpenClaw Launcher
3. First launch auto-initializes the environment (~2-5 minutes)
4. Select an AI provider and configure your API Key
5. Click "Initialize & Start" → browser opens automatically

### Developers

```bash
# Clone the repo
git clone https://github.com/ZsTs119/openclaw-launcher.git
cd openclaw-launcher

# Install dependencies
npm install

# Development mode (hot reload)
npm run tauri dev

# Production build
npm run tauri build
```

#### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 22
- [Rust](https://www.rust-lang.org/tools/install) ≥ 1.70
- **Linux:** `libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev`

## 🏗️ Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Rust (Tauri v2)
- **Styling:** Vanilla CSS with design tokens
- **Build:** Vite + Cargo
- **CI/CD:** GitHub Actions (auto-build for Windows/macOS/Linux)

## 🗺️ Roadmap

- [x] **Phase 1:** MVP Installer ✅
- [x] **Phase 2:** UX Polish ✅
- [x] **Phase 3:** API Key Config + UI Rewrite ✅
- [x] **Phase 4:** Architecture Refactor (11 stages) ✅
- [x] **Phase 5:** UI Polish + Features ✅
- [ ] **Phase 6:** Enterprise Distribution (planned)

## 🤝 Contributing

Contributions welcome! Please follow [Conventional Commits](https://www.conventionalcommits.org/):

1. **Fork** this repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m "feat(scope): add amazing feature"`
4. Push: `git push origin feat/amazing-feature`
5. Open a **Pull Request**

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

## ☕ Support & Contact

If OpenClaw Launcher helps you, feel free to buy the author a coffee ☕ or follow us for updates 📱

<div align="center">
<table>
<tr>
<td align="center"><strong>☕ Donate</strong></td>
<td align="center"><strong>📱 WeChat Official</strong></td>
</tr>
<tr>
<td align="center"><img src="docs/donate.jpg" alt="Donate" width="250" /></td>
<td align="center"><img src="docs/wechat-official.jpg" alt="WeChat" width="250" /></td>
</tr>
</table>
</div>

---

<div align="center">

**If this project helps you, please give it a ⭐ Star!**

Made with ❤️ by [ZsTs119](https://github.com/ZsTs119)

</div>
