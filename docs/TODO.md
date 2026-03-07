# OpenClaw Launcher - 开发任务总表 (AI 开发规范版)

> 本文件用于追踪项目的整体进度，由 AI 或开发者在完成特定功能后打勾更新。它作为跨越多个 Context 的长期记忆与进度锚点。

## 📂 项目结构与文档规范 (当前)
- [x] 输出完整商业 PRD (`/docs/PRD.md`)
- [x] 建立阶段性开发文档 (`/docs/phases/*.md`)
- [x] 建立并维护此全局任务表 (`/docs/TODO.md`)

## 🛠️ Phase 1: MVP 核心安装器 (参考 /docs/phases/phase1_mvp.md)
- [x] 搭建 Tauri + React/Vue 基础项目脚手架 ✅ (570 crates compiled, 0 errors, .deb/.rpm OK)
- [x] 实现 Rust 侧 Node.js 下载与本地释放 (AppData 沙盒机制) ✅ (667 crates, 0 errors)
- [x] 实现源码 ZIP 网络拉取与解压 (智能切换镜像源) ✅ (GitHub + 2 mirrors fallback)
- [x] 实现局部环境变量下的 `npm install` ✅ (Taobao mirror autoswitch + retry)
- [x] 实现基础控制台 UI (启停服务、读取基础日志) ✅ (React + Rust full-stack, 0 errors)
- [ ] [Phase 1 测试]: 在纯净版 Windows/Mac 虚拟机无报错启动 OpenClaw。

## 🎨 Phase 2: "Aha Moment" 体验改造 (参考 /docs/phases/phase2_experience.md)
- [x] [P0] 配置注入: 自动生成 `openclaw.json` (非破坏性) ✅
- [x] [P0] 配置注入: 自动生成 `models.json` (预置免费 API Key) ✅
- [x] [P1] 工作区向导: 首次启动弹出文件夹选择对话框 ✅
- [x] [P1] 启动后自动打开浏览器 (`localhost:3000`) ✅
- [x] [P2] UI 升级: 状态大卡片 (运行时长、模型、工作区路径) ✅
- [x] [P2] 人话日志: 日志翻译层 + 原始/人话切换 ✅
- [x] [P3] 预置技能包: 内置 `skill-creator` 和 `skill-finder` ✅
- [ ] [Phase 2 测试]: 小白用户双击安装 → 浏览器弹出 → 直接对话

## 🛡️ Phase 2.5: 稳定性兜底 (真实用户上线前必修)
- [x] [P0] pnpm.cjs 路径动态探测 (不同 npm 版本全局安装路径不同) ✅
- [x] [P0] 端口 3000 占用检测 + 自动换端口或提示 ✅
- [x] [P0] 服务进程崩溃检测 (进程退出但 UI 仍显示"运行中") ✅
- [ ] [P1] Windows 中文用户名路径编码兼容
- [ ] [P1] Windows 260 字符长路径限制处理
- [ ] [P2] 完全断网友好提示 (当前报错信息不够人话)
- [ ] [P2] 磁盘空间预检查 (下载前检测是否有 500MB+ 可用空间)
- [ ] [P3] OpenClaw 源码版本检测与自动更新机制

## ⚙️ Phase 3: 管家与生态补全
- [ ] 实现退出隐藏 (System Tray) 与后台守护模式
- [ ] 实现客户端级的 UI 换模型和换秘钥功能
- [ ] UI 大重构: 现代化深色主题 + 响应式布局
- [ ] 设置页面: 端口配置、语言切换、工作区管理
- [ ] 一键修复网络: DNS/代理检测 + 自动切镜像
- [ ] 日志导出: 一键打包日志供用户反馈 bug

## 🏢 Phase 4: 企业级分发与规模化
- [ ] Inno Setup 打包: 防火墙白名单注入
- [ ] Windows 代码签名 (EV 证书) — 消除 SmartScreen 警告
- [ ] macOS 公证 (notarization) — 消除 Gatekeeper 拦截
- [ ] 应用内自动更新 (tauri-plugin-updater)
- [ ] 企业代理服务器支持 (HTTP_PROXY/HTTPS_PROXY)
- [ ] 遥测与错误上报 (可选 opt-in, 帮助改进产品)
- [ ] ARM Windows 支持 (Surface Pro X 等设备)
