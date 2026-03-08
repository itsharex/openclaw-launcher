import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Cpu, SlidersHorizontal, Network } from "lucide-react";
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
import { DashboardTab } from "./components/DashboardTab";
import { ModelsTab } from "./components/ModelsTab";
import { SettingsTab } from "./components/SettingsTab";
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
            <DashboardTab
              running={running}
              loading={loading}
              servicePort={servicePort}
              uptime={uptime}
              currentModelName={currentModelName}
              currentProviderName={currentProviderName}
              handleStart={handleStart}
              handleStop={handleStop}
              setShowKeyModal={setShowKeyModal}
              setShowModelSwitchModal={setShowModelSwitchModal}
            />
          )}

          {/* ===== Models Tab ===== */}
          {activeTab === "models" && (
            <ModelsTab
              providers={providers}
              filteredProviders={filteredProviders}
              currentConfig={currentConfig}
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
              setShowKeyModal={setShowKeyModal}
              handleSaveConfig={handleSaveConfig}
            />
          )}

          {/* ===== Settings Tab ===== */}
          {activeTab === "settings" && (
            <SettingsTab
              activeSettingsTab={activeSettingsTab}
              setActiveSettingsTab={setActiveSettingsTab}
              workspacePath={workspacePath}
              servicePort={servicePort}
              currentConfig={currentConfig}
              running={running}
              reinstalling={reinstalling}
              repairing={repairing}
              logs={logs}
              showRawLogs={showRawLogs}
              setShowRawLogs={setShowRawLogs}
              logRef={logRef}
              handleSwitchWorkspace={handleSwitchWorkspace}
              handleReinstall={handleReinstall}
              handleRepairConnection={handleRepairConnection}
              handleReset={handleReset}
              setShowKeyModal={setShowKeyModal}
              setInfoModalTitle={setInfoModalTitle}
            />
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
