import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Cpu, SlidersHorizontal, Settings as SettingsIcon, Hexagon, Box, Github, RefreshCw, Network, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// ===== Extracted modules =====
import type { TabId } from "./types";
import { CATEGORY_LABELS } from "./types";
import { formatUptime } from "./utils/log-humanizer";
import { Modal, ModalFooter } from "./components/ui/Modal";
import { Header } from "./components/Header";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { SetupWizard } from "./components/SetupWizard";
import { useLogs } from "./hooks/useLogs";
import { useConfig } from "./hooks/useConfig";
import { useService } from "./hooks/useService";

// ===== App =====
function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "logs" | "about">("general");
  const [running, setRunning] = useState(false);

  // === Hooks ===
  const {
    logs, showRawLogs, setShowRawLogs,
    repairToast, setRepairToast,
    logRef, addLog,
  } = useLogs();

  const {
    providers, selectedCategory, setSelectedCategory,
    selectedProvider, setSelectedProvider,
    apiKeyInput, setApiKeyInput, baseUrlInput, setBaseUrlInput,
    selectedModel, setSelectedModel,
    configSaving, configStatus, setConfigStatus,
    currentConfig, filteredProviders,
    showKeyModal, setShowKeyModal, showResetModal, setShowResetModal,
    showReinstallModal, setShowReinstallModal,
    showModelSwitchModal, setShowModelSwitchModal,
    infoModalTitle, setInfoModalTitle,
    checkApiKey, handleSaveConfig, handleSetModel, handleOpenRegister,
    handleReset, confirmReset, handleReinstall,
  } = useConfig({ addLog, running, setRunning });

  const {
    phase, loading,
    progress, progressMsg, uptime, servicePort,
    workspacePath, reinstalling, repairing,
    handleSelectFolder, handleConfirmWorkspace, handleSwitchWorkspace,
    handleStart, handleStop,
    confirmReinstall, handleRepairConnection,
  } = useService({ addLog, checkApiKey, setRepairToast, setShowReinstallModal, running, setRunning });

  const getStatusClass = () => {
    if (loading) return "loading";
    if (running) return "running";
    if (phase !== "ready") return "loading";
    return "idle";
  };

  // Find display names for current config
  const currentProviderName = currentConfig?.provider
    ? providers.find(p => p.id === currentConfig.provider)?.name || (currentConfig.provider === "custom" ? "自定义中转站" : currentConfig.provider)
    : (currentConfig?.has_api_key ? "自定义" : "未配置");
  const currentModelName = currentConfig?.model || "未选择";

  // ===== Setup Screens (Checking / Initializing / Workspace) =====
  if (phase !== "ready") {
    return (
      <SetupWizard
        phase={phase}
        progress={progress}
        progressMsg={progressMsg}
        workspacePath={workspacePath}
        loading={loading}
        onSelectFolder={handleSelectFolder}
        onConfirmWorkspace={handleConfirmWorkspace}
      />
    );
  }



  // ===== Main App with Tabs =====
  return (
    <div className="app">
      <Header running={running} phase={phase} statusClass={getStatusClass()} />

      {/* Tab Navigation (Premium Navbar) */}
      <nav className="tab-nav">
        {([
          { id: "dashboard" as TabId, label: "仪表盘", icon: <Activity size={18} strokeWidth={1.5} /> },
          { id: "models" as TabId, label: "AI 引擎", icon: <Network size={18} strokeWidth={1.5} /> },
          { id: "settings" as TabId, label: "设置中心", icon: <SlidersHorizontal size={18} strokeWidth={1.5} /> },
        ]).map((tab) => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="tab-content">
        <AnimatePresence mode="wait">
          {/* ===== Dashboard Tab ===== */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              className="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="dashboard-hero">
                <div className={`status-ring ${running ? 'running' : 'stopped'}`}>
                  {running ? <Activity size={42} strokeWidth={1.5} color="var(--accent-green)" /> : <Box size={42} strokeWidth={1.5} color="var(--text-muted)" />}
                </div>
                <h2 className="hero-status-text">
                  {running ? "OpenClaw 核心运行中" : "引擎已就绪"}
                </h2>
                <div className="hero-subtext">
                  {running ? `本地接口已挂载至 localhost:${servicePort}` : "点击下方按钮启动本地 AI 驱动核心"}
                </div>

                <div className="hero-controls">
                  <button className={`btn-primary btn-hero ${running ? "stop" : "start"}`}
                    onClick={running ? handleStop : handleStart} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="spin" size={18} />
                        {running ? "中断中..." : "引擎唤醒中..."}
                      </>
                    ) : (
                      running ? "⏹ 中断服务" : <><Play size={16} fill="currentColor" /> 初始化并启动</>
                    )}
                  </button>
                  {running && (
                    <button className="btn-secondary btn-hero-sub animate-fade-in"
                      onClick={() => invoke("open_url", { url: `http://localhost:${servicePort}?token=openclaw-launcher-local` })}>
                      <Activity size={16} strokeWidth={2} /> 访问控制台
                    </button>
                  )}
                </div>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card" onClick={() => setShowModelSwitchModal(true)} style={{ cursor: 'pointer' }} title="点击切换模型">
                  <div className="stat-icon"><Cpu size={16} strokeWidth={2} /></div>
                  <div className="stat-details">
                    <div className="stat-label">驱动模型 (点击切换)</div>
                    <div className="stat-value">{currentModelName}</div>
                  </div>
                </div>

                <div className="stat-card" onClick={() => setShowKeyModal(true)} style={{ cursor: 'pointer' }} title="点击配置 API">
                  <div className="stat-icon"><Hexagon size={16} strokeWidth={2} /></div>
                  <div className="stat-details">
                    <div className="stat-label">计算节点 (提供商)</div>
                    <div className="stat-value">{currentProviderName}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon"><Activity size={16} strokeWidth={2} /></div>
                  <div className="stat-details">
                    <div className="stat-label">连续运行时长</div>
                    <div className="stat-value">{running ? formatUptime(uptime) : "休眠中"}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Models Tab ===== */}
          {activeTab === "models" && (
            <motion.div
              key="models"
              className="models-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="page-title">🤖 模型配置</h2>
              <p className="page-desc">选择 AI 模型提供商，配置 API Key 后即可开始使用。</p>

              <div className="category-tabs" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                  <button key={key}
                    className={`category-btn ${selectedCategory === key ? "active" : ""}`}
                    onClick={() => { setSelectedCategory(key); setSelectedProvider(""); setConfigStatus(""); }}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              {selectedCategory === "custom" ? (
                <div className="custom-config animate-fade-in" style={{ maxWidth: 500, margin: '0 auto' }}>
                  <div className="form-group">
                    <label>API Base URL</label>
                    <input type="url" placeholder="https://your-relay.com/v1" value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>API Key</label>
                    <input type="password" placeholder="sk-..." value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>模型 ID（可选）</label>
                    <input type="text" placeholder="gpt-4o / deepseek-chat / ..." value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)} className="input-field" />
                  </div>
                  <button className="btn-primary" style={{ width: '100%', marginTop: 16, padding: '12px' }} onClick={handleSaveConfig} disabled={configSaving}>
                    {configSaving ? "保存中..." : "💾 保存配置"}
                  </button>
                  {configStatus && <div className="config-status" style={{ marginTop: 12 }}>{configStatus}</div>}
                </div>
              ) : (
                <div className="provider-list animate-fade-in">
                  {filteredProviders.map((p) => (
                    <div key={p.id}
                      className={`provider-card ${currentConfig?.provider === p.id ? "active-provider" : ""}`}
                      onClick={() => {
                        setSelectedProvider(p.id);
                        setBaseUrlInput(p.base_url);
                        setSelectedModel(p.models[0]?.id || "");
                        setConfigStatus("");
                        setShowKeyModal(true);
                      }}>
                      <div className="provider-header">
                        <span className="provider-name">{p.name} <span style={{ fontSize: 12, fontWeight: 'normal', color: 'var(--text-muted)' }}>{currentConfig?.provider === p.id ? " (当前使用)" : ""}</span></span>
                        {p.category === "free" && <span className="badge-free">免费</span>}
                      </div>
                      <p className="provider-desc">{p.description}</p>
                      <div className="provider-models">
                        {p.models.slice(0, 3).map((m) => (
                          <span key={m.id} className="model-tag">{m.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== Settings Tab ===== */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              className="settings-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="settings-sidebar">
                <h2 className="sidebar-title">设置中心</h2>
                <nav className="sidebar-nav">
                  <button className={`sidebar-btn ${activeSettingsTab === "general" ? "active" : ""}`} onClick={() => setActiveSettingsTab("general")}>
                    <SettingsIcon size={16} strokeWidth={1.5} /> 通用
                  </button>
                  <button className={`sidebar-btn ${activeSettingsTab === "logs" ? "active" : ""}`} onClick={() => setActiveSettingsTab("logs")}>
                    <Box size={16} strokeWidth={1.5} /> 日志诊断
                  </button>
                  <button className={`sidebar-btn ${activeSettingsTab === "about" ? "active" : ""}`} onClick={() => setActiveSettingsTab("about")}>
                    <Hexagon size={16} strokeWidth={1.5} /> 关于
                  </button>
                </nav>
              </div>

              <div className="settings-content-area">
                <div className="settings-content-scroll">
                  {activeSettingsTab === "general" && (
                    <div className="settings-group animate-fade-in">
                      <h3 className="settings-section-title">🎛️ 通用设置</h3>
                      <div className="setting-item">
                        <div className="setting-left">
                          <div className="setting-label">工作区目录</div>
                          <div className="setting-value" style={{ fontSize: 13, userSelect: 'text' }}>
                            {workspacePath || "~/Documents/OpenClaw-Projects"}
                          </div>
                        </div>
                        <button className="btn-secondary" onClick={handleSwitchWorkspace}>📂 更改</button>
                      </div>

                      <div className="setting-item">
                        <div className="setting-left">
                          <div className="setting-label">服务端口</div>
                          <div className="setting-value">{servicePort}</div>
                        </div>
                      </div>

                      <div className="setting-item">
                        <div className="setting-left">
                          <div className="setting-label">API Key 状态</div>
                          <div className="setting-value">
                            {currentConfig?.has_api_key ? "✅ 已配置" : "❌ 未配置"}
                          </div>
                        </div>
                        <button className="btn-secondary" onClick={() => setShowKeyModal(true)}>🔑 生命周期重配</button>
                      </div>

                      <div className="setting-item" style={{ marginTop: 24 }}>
                        <div className="setting-left">
                          <div className="setting-label">重新安装环境</div>
                          <div className="setting-value" style={{ fontSize: 12 }}>
                            删除依赖并重新安装，适用于安装失败或环境损坏
                          </div>
                        </div>
                        <button className="btn-secondary" onClick={handleReinstall} disabled={reinstalling}>
                          {reinstalling ? "安装中..." : "🔄 重新安装"}
                        </button>
                      </div>

                      <div className="setting-item" style={{ marginTop: 12 }}>
                        <div className="setting-left">
                          <div className="setting-label">一键检测修复</div>
                          <div className="setting-value" style={{ fontSize: 12 }}>
                            修复连接认证失败、设备签名等问题（重启服务 + 刷新会话）
                          </div>
                        </div>
                        <button className="btn-secondary" onClick={handleRepairConnection} disabled={repairing}>
                          {repairing ? "修复中..." : "🔧 一键修复"}
                        </button>
                      </div>

                      <div className="setting-item setting-danger" style={{ marginTop: 16 }}>
                        <div className="setting-left">
                          <div className="setting-label" style={{ color: 'var(--accent-red)' }}>恢复出厂设置</div>
                          <div className="setting-value" style={{ fontSize: 12 }}>
                            抹除 openclaw.json 与 API Key 等敏感信息，回到纯净状态
                          </div>
                        </div>
                        <button className="btn-danger" onClick={handleReset}>🗑️ 擦除数据</button>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === "logs" && (
                    <div className="settings-group animate-fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className="settings-section-title" style={{ margin: 0 }}>📄 日志诊断</h3>
                        <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
                          📦 导出诊断 ZIP
                        </button>
                      </div>
                      <div className="log-panel" style={{ height: 380, borderRadius: 'var(--radius)' }}>
                        <div className="log-header" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)' }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                            <label className="log-toggle" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <input type="checkbox" checked={showRawLogs} onChange={(e) => setShowRawLogs(e.target.checked)} />
                              <span>显示原始日志流</span>
                            </label>
                          </div>
                        </div>
                        <div className="log-content full-height" ref={logRef} style={{ padding: 12, fontSize: 12 }}>
                          {logs.length === 0 ? (
                            <div className="log-empty">暂无活动日志</div>
                          ) : (
                            logs.slice(-20).map((log, i) => {
                              const displayMsg = !showRawLogs && log.humanized ? log.humanized : log.message;
                              return (
                                <div className="log-line" key={i}>
                                  <span className="log-time" style={{ opacity: 0.5 }}>{log.time}</span>
                                  <span className={`log-msg ${log.level}`}>{displayMsg}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === "about" && (
                    <div className="settings-group animate-fade-in about-section">
                      <div className="about-hero">
                        <div className="about-logo">OpenClaw</div>
                        <div className="about-title">新一代 AI 本地驱动核心</div>
                        <div className="about-version-card">
                          <span>当前版本 v0.3.1</span>
                          <button className="btn-ghost" title="检查更新">
                            <RefreshCw size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      <div className="about-links">
                        <button className="about-link-card" onClick={() => invoke("open_url", { url: "https://github.com/ZsTs119/openclaw-launcher" })}>
                          <Github size={18} strokeWidth={1.5} />
                          <div className="link-text">查看 GitHub 源码</div>
                        </button>
                        <button className="about-link-card" onClick={() => setInfoModalTitle("💬 关注微信公众号 / 加入交流群")}>
                          <span style={{ fontSize: 18 }}>💬</span>
                          <div className="link-text">加入交流群 / 联系作者</div>
                        </button>
                        <button className="about-link-card" onClick={() => setInfoModalTitle("☕ 赞赏与支持")}>
                          <span style={{ fontSize: 18 }}>☕</span>
                          <div className="link-text">赞赏与支持项目发展</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generic Info / QR Code Modal */}
      <Modal show={!!infoModalTitle} onClose={() => setInfoModalTitle("")} title={infoModalTitle} maxWidth={360}>
        <div className="modal-desc" style={{ marginTop: 16, marginBottom: 24, padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>[ 二维码图片占位符 ]</div>
          <div style={{ fontSize: 12, marginTop: 12 }}>请在 assets 文件夹替换为你个人的二维码图片</div>
        </div>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setInfoModalTitle("")}>关闭</button>
      </Modal>

      {/* Model Switch Modal */}
      <Modal show={showModelSwitchModal} onClose={() => setShowModelSwitchModal(false)} title="🔄 切换模型" maxWidth={400}>
        <div className="modal-desc">选择要使用的 AI 模型</div>
        {currentConfig?.provider ? (
          <div className="model-switch-list" style={{ marginTop: 12 }}>
            {providers.find(p => p.id === currentConfig.provider)?.models.map((m) => (
              <button
                key={m.id}
                className={`model-switch-item ${currentConfig.model?.endsWith(m.id) ? "active" : ""}`}
                onClick={async () => {
                  const fullModelId = `${currentConfig.provider}/${m.id}`;
                  await handleSetModel(fullModelId);
                  setShowModelSwitchModal(false);
                }}
              >
                <span className="model-switch-name">{m.name}</span>
                {currentConfig.model?.endsWith(m.id) && <span className="model-switch-badge">当前</span>}
              </button>
            )) || <div style={{ color: "var(--text-secondary)" }}>暂无可用模型</div>}
          </div>
        ) : (
          <div style={{ color: "var(--text-secondary)", marginTop: 12 }}>
            请先在「模型」标签页配置 API 提供商
          </div>
        )}
        <ModalFooter>
          <button className="btn-secondary" onClick={() => setShowModelSwitchModal(false)}>关闭</button>
        </ModalFooter>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal show={showResetModal} title="⚠️ 重置配置" maxWidth={420}>
        <div className="modal-desc" style={{ textAlign: "left" }}>
          <p style={{ marginBottom: 12 }}>仅重置 API Key 和模型配置（openclaw.json 中的 models/agents 部分）。</p>
          <p style={{ color: "var(--accent-green)", marginBottom: 4 }}>✅ 不会删除：</p>
          <ul style={{ paddingLeft: 20, marginBottom: 12, color: "var(--text-secondary)" }}>
            <li>对话历史和记忆</li>
            <li>Agent 技能和书签</li>
            <li>工作区文件</li>
          </ul>
          <p style={{ color: "var(--accent-red)", marginBottom: 4 }}>🗑️ 将清除：</p>
          <ul style={{ paddingLeft: 20, color: "var(--text-secondary)" }}>
            <li>API Key 配置</li>
            <li>模型选择和默认模型</li>
          </ul>
        </div>
        <ModalFooter>
          <button className="btn-secondary" onClick={() => setShowResetModal(false)}>取消</button>
          <button className="btn-danger" onClick={confirmReset}>确认重置</button>
        </ModalFooter>
      </Modal>

      {/* Reinstall Confirmation Modal */}
      <Modal show={showReinstallModal} title="🔄 重新安装运行环境" maxWidth={420}>
        <div className="modal-desc" style={{ textAlign: "left" }}>
          <p style={{ marginBottom: 12 }}>这将删除 node_modules 并重新下载所有依赖，可能需要几分钟。</p>
          <p style={{ color: "var(--accent-green)", marginBottom: 4 }}>适用于：</p>
          <ul style={{ paddingLeft: 20, marginBottom: 12, color: "var(--text-secondary)" }}>
            <li>安装过程出错</li>
            <li>环境损坏或依赖缺失</li>
            <li>版本升级后不兼容</li>
          </ul>
          <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>⏱️ 根据网络情况，可能需要 3-10 分钟</p>
        </div>
        <ModalFooter>
          <button className="btn-secondary" onClick={() => setShowReinstallModal(false)}>取消</button>
          <button className="btn-danger" onClick={confirmReinstall}>确认重新安装</button>
        </ModalFooter>
      </Modal>

      {/* Connection Repair Toast */}
      <AnimatePresence>
        {repairToast && (
          <motion.div
            className="repair-toast"
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%',
              background: 'linear-gradient(135deg, rgba(30,30,40,0.98), rgba(40,30,30,0.98))',
              border: '1px solid var(--accent-red, #ff4444)',
              borderRadius: 'var(--radius, 12px)',
              padding: '16px 24px', zIndex: 9999,
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxWidth: 480,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#ff6b6b' }}>⚠️ 检测到连接认证失败</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
                设备签名校验异常，点击一键修复（重启服务 + 刷新会话）
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13 }}
              onClick={handleRepairConnection}
              disabled={repairing}
            >
              {repairing ? "修复中..." : "🔧 一键修复"}
            </button>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              onClick={() => setRepairToast(false)}
              title="关闭"
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory API Key Modal (renders on top of everything) */}
      <ApiKeyModal
        show={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        providers={providers}
        filteredProviders={filteredProviders}
        currentConfig={currentConfig}
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        baseUrlInput={baseUrlInput}
        setBaseUrlInput={setBaseUrlInput}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        configSaving={configSaving}
        configStatus={configStatus}
        setConfigStatus={setConfigStatus}
        onSaveConfig={handleSaveConfig}
        onOpenRegister={handleOpenRegister}
      />
    </div>
  );
}


export default App;
