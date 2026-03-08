# Phase 4: 架构重构 🏗️

> 🚧 开发中 — 目标：模块化 + 可复用 + 多人协作友好

## 目标

| 维度 | 目标 |
|---|---|
| **协作性** | 多人同时开发不同模块互不影响 |
| **可维护性** | 新人看代码 30 分钟就能上手一个模块 |
| **稳定性** | 每个阶段验证通过才进下一步，功能零回归 |
| **复用性** | 通用组件（Modal/Toast/Button）可跨页面复用 |

---

## 阶段计划

### Stage 1: 基础设施 & 开发规范 ⏱️ ~1h

**目标**：建立规范，不改任何功能代码

- [ ] 创建 `AGENTS.md`（AI 开发规范 + 多人协作约定）
- [ ] 创建 `src/types/index.ts`（从 App.tsx 抽取所有 TypeScript 类型）
- [ ] 创建 `src/utils/log-humanizer.ts`（从 App.tsx 抽取日志翻译）
- [ ] 创建 `src/utils/ansi-strip.ts`（从 App.tsx 抽取 ANSI 清理）
- [ ] App.tsx 改为 import 这些模块（功能不变，只是 import 路径变了）

**验证**：
```bash
npm run tauri dev  # UI 完全和之前一样
# 手动测试：启动服务、查看日志、切换设置 — 全部正常
```

---

### Stage 2: 通用 UI 组件库 ⏱️ ~2h

**目标**：抽取可复用 UI 组件，建立设计系统

- [ ] `src/components/ui/Modal.tsx` — 通用弹窗（替换 App.tsx 中所有弹窗）
- [ ] `src/components/ui/Toast.tsx` — 通知提示（替换修复连接 toast）
- [ ] `src/components/ui/Button.tsx` — 按钮组件（primary/secondary/danger 变体）
- [ ] `src/components/ui/Card.tsx` — 卡片容器
- [ ] `src/components/ui/StatusBadge.tsx` — 状态标签（运行中/已停止/错误）
- [ ] 对应 CSS 文件 `src/components/ui/styles/` 每个组件独立样式

**验证**：
```bash
# 所有弹窗用 <Modal> 组件渲染
# API Key 弹窗、重置确认、工作区选择 — 视觉和交互完全一致
```

---

### Stage 3: 页面级组件拆分 ⏱️ ~3h

**目标**：App.tsx 从 1170 行降到 ~150 行，变成纯路由

- [ ] `src/components/SetupWizard.tsx` — 初始化安装向导
- [ ] `src/components/Dashboard.tsx` — 仪表盘主视图
- [ ] `src/components/LogViewer.tsx` — 日志诊断面板
- [ ] `src/components/SettingsPanel.tsx` — 设置中心
- [ ] `src/components/ApiKeyModal.tsx` — API Key 配置弹窗（使用 Stage 2 的 Modal）
- [ ] `src/components/Header.tsx` — 顶部导航栏（已有雏形）
- [ ] `src/components/Sidebar.tsx` — 侧边栏（如有需要）
- [ ] `App.tsx` 只做：路由 phase 切换 + 全局状态传递

**验证**：
```bash
# 完整流程测试：
# 1. 全新安装流程（删除 AppData/Local/OpenClawLauncher）
# 2. 配置 API Key
# 3. 启动服务 → 聊天
# 4. 设置中心切换模型
# 5. 日志查看
# 6. 重新安装环境
# 7. 一键修复连接
```

---

### Stage 4: 逻辑层抽取（Custom Hooks） ⏱️ ~2h

**目标**：UI 组件只负责渲染，逻辑通过 hooks 提供

- [ ] `src/hooks/useService.ts` — 服务启停、状态监控、端口管理
- [ ] `src/hooks/useConfig.ts` — 配置读写、Provider 查询、模型切换
- [ ] `src/hooks/useLogs.ts` — 日志采集、格式化、自动滚动
- [ ] `src/hooks/useSetup.ts` — 安装流程状态管理
- [ ] `src/hooks/useToast.ts` — Toast 通知队列管理
- [ ] 各页面组件从 props 改为直接使用 hooks

**验证**：
```bash
# 同 Stage 3 完整流程测试
# + 确认 hooks 可以被多个组件复用（如 useService 同时被 Header 和 Dashboard 使用）
```

---

### Stage 5: 后端模块拆分 ⏱️ ~2h

**目标**：消灭 God module，统一路径管理

- [ ] `src-tauri/src/paths.rs` — 统一路径管理
  - `sandbox_dir()` / `user_config_dir()` / `node_dir()` / `openclaw_engine_dir()`
  - 所有其他模块通过 `paths::xxx()` 获取路径
- [ ] `src-tauri/src/download.rs` — 从 openclaw.rs 拆出下载 + 解压逻辑
- [ ] `src-tauri/src/installer.rs` — 从 openclaw.rs 拆出 pnpm/npm 安装
- [ ] `src-tauri/src/setup.rs` — 编排层（调用 download + installer + config）
- [ ] `openclaw.rs` 只保留 check_xxx 函数和常量

**验证**：
```bash
cargo test                    # Rust 单元测试
npm run tauri dev             # 完整流程测试
# + 全新安装测试（删除 AppData）
```

---

### Stage 6: Provider 数据外置 ⏱️ ~1h

**目标**：加新 Provider 不需要改 Rust、不需要重新编译

- [ ] `src-tauri/resources/providers.json` — Provider 数据文件
- [ ] `config.rs` 的 `get_providers()` 改为从 JSON 文件加载
- [ ] 前端通过 Tauri invoke 获取（接口不变）

**验证**：
```bash
# 在 providers.json 里加一个测试 Provider
# 重启 → 前端 AI 引擎列表能看到新 Provider
# 不需要重新编译 Rust
```

---

## 文件结构目标

### 前端（Stage 1-4 完成后）
```
src/
├── App.tsx                    ← ~150行，纯路由
├── App.css                    ← 全局样式变量
├── main.tsx
├── types/
│   └── index.ts               ← 所有共享类型
├── utils/
│   ├── log-humanizer.ts
│   └── ansi-strip.ts
├── hooks/
│   ├── useService.ts
│   ├── useConfig.ts
│   ├── useLogs.ts
│   ├── useSetup.ts
│   └── useToast.ts
├── components/
│   ├── Header.tsx
│   ├── SetupWizard.tsx
│   ├── Dashboard.tsx
│   ├── LogViewer.tsx
│   ├── SettingsPanel.tsx
│   ├── ApiKeyModal.tsx
│   └── ui/                    ← 可复用基础组件
│       ├── Modal.tsx
│       ├── Toast.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── StatusBadge.tsx
│       └── styles/
│           ├── modal.css
│           ├── toast.css
│           └── ...
└── assets/
```

### 后端（Stage 5-6 完成后）
```
src-tauri/src/
├── main.rs
├── lib.rs                     ← 命令注册
├── paths.rs                   ← 🆕 统一路径管理
├── environment.rs             ← Node 沙箱（不变）
├── service.rs                 ← 服务启停（不变）
├── download.rs                ← 🆕 下载 + 解压
├── installer.rs               ← 🆕 pnpm/npm 安装
├── setup.rs                   ← 🆕 编排层
├── config.rs                  ← 配置读写（精简）
└── openclaw.rs                ← 只保留 check 函数
```

---

## 协作约定

每个 Stage 完成后：
1. 运行完整验证测试
2. `git commit` 并标注 Stage 号
3. 推到 `v2-dev` 分支
4. 确认无误后再开始下一个 Stage

**任何 Stage 出问题**：直接 `git revert` 回到上一个通过的 Stage，不做修修补补。
