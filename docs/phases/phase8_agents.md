# Phase 8: 智能体配置界面

> 📋 待开始 | 目标版本：`v0.6.0`

## 铁律

> [!CAUTION]
> **三端验收**：所有改动必须在 Windows / Linux / macOS 三端验证通过。
> **UI 一致**：深色主题配色 (`--bg-*`, `--accent-*`)、Lucide 图标、`framer-motion` 动画。新增页面必须与现有 Tab 视觉风格一致。
> **不破坏现有功能**：新增 Tab 不影响仪表盘/AI 引擎/设置的交互逻辑。

---

## 8.1 Tab 基础设施扩展

### 方案

1. **types/index.ts**: `TabId` 新增 `"agents"` | `"analytics"`
2. **App.tsx**: nav 新增 "智能体" + "数据统计" 两个 Tab 按钮
3. **Lucide 图标**: 智能体用 `Bot`，数据统计用 `BarChart3`

### 边界情况
- Tab 数量从 3 → 5，需确认窗口最小宽度 860px 下不换行
- `analytics` Tab 此阶段仅占位（"敬请期待" 空态），Phase 10 实现

## 8.2 Agent 管理功能

### 存储结构
```
~/.openclaw/
├── openclaw.json          ← 全局配置 (已有)
├── agents/
│   ├── main/              ← 默认 Agent (不可删除)
│   │   └── agent/
│   │       ├── models.json
│   │       └── agent.json ← 系统提示词等
│   ├── coder/             ← 用户创建的 Agent
│   │   └── agent/
│   │       ├── models.json
│   │       └── agent.json
│   └── ...
└── skills/                ← 全局技能目录
```

### 新增后端命令 (`agents.rs` NEW)

| 命令 | 说明 |
|---|---|
| `list_agents()` | 扫描 `~/.openclaw/agents/` 目录，返回 Agent 列表 |
| `get_agent_detail(name)` | 读取单个 Agent 的 models.json + agent.json |
| `create_agent(name, model, system_prompt)` | 创建目录 + 写入配置 |
| `update_agent(name, ...)` | 更新配置文件 |
| `delete_agent(name)` | 删除 Agent 目录（`main` 不可删除） |
| `list_skills()` | 扫描 skills 目录，返回 SKILL.md frontmatter |

### 前端 AgentsTab 布局

- **Agent 卡片网格**: 每个 Agent 一张卡片（名称 / 模型 / 状态标识）
- **创建按钮**: 右上角 `[+ 创建 Agent]`
- **创建弹窗**: Agent 名称 + 模型下拉 + 系统提示词文本框
- **底部技能区**: 已安装技能列表，展示 SKILL.md 中的 name/description

### 边界情况
- `main` Agent 不可删除，前端禁用删除按钮
- Agent 名称校验: `[a-z0-9-]`，1-32 字符，不可重名
- 技能目录不存在时显示空态 "暂无技能"
- 配置文件损坏/缺失时容错（返回默认值而非报错）
- `agents/` 目录不存在时自动创建

---

## 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| [NEW] `src-tauri/src/agents.rs` | 新增 | Agent CRUD + 技能列表 |
| [NEW] `src/components/AgentsTab.tsx` | 新增 | 智能体管理页面 |
| [NEW] `src/components/AnalyticsTab.tsx` | 新增 | 数据统计占位页面 |
| [NEW] `src/styles/agents.css` | 新增 | 智能体页面样式 |
| [NEW] `src/styles/analytics.css` | 新增 | 数据统计占位样式 |
| `src/types/index.ts` | 修改 | TabId 新增 agents/analytics |
| `src/App.tsx` | 修改 | nav + 渲染新 Tab |
| `src-tauri/src/lib.rs` | 修改 | 注册新命令 |

---

## 验收标准

```
✅ 5 个 Tab 正确展示，切换无闪烁/抖动
✅ 最小窗口宽度下 Tab 不换行
✅ 能看到 Agent 列表（至少 `main`）
✅ 创建新 Agent → 目录 + 配置文件正确生成
✅ 编辑 Agent 模型/提示词 → 配置正确更新
✅ 删除非 main Agent → 目录被清理
✅ 删除 main Agent → 操作被拒绝
✅ 已安装技能正确展示
✅ 空态（无 Agent / 无技能）友好显示
✅ [Windows / Linux / macOS] 三端验证通过
✅ cargo test 通过
```
