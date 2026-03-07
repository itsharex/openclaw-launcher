import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Activity, Cpu, SlidersHorizontal, Settings as SettingsIcon, Hexagon, Box, Github, Network, CreditCard, Wrench, Key, Play, Loader2, RefreshCw } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// ===== Types =====
type AppPhase = "checking" | "initializing" | "workspace" | "ready";
type TabId = "dashboard" | "models" | "settings";

interface LogEntry {
  time: string;
  level: string;
  message: string;
  humanized?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  category: string;
  base_url: string;
  register_url: string;
  description: string;
  models: ModelInfo[];
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  is_free: boolean;
}

interface CurrentConfig {
  has_api_key: boolean;
  provider: string | null;
  model: string | null;
  base_url: string | null;
}

// ===== Log humanization =====
const LOG_TRANSLATIONS: [RegExp, string][] = [
  [/npm warn/i, "⚠️ 依赖警告（可忽略）"],
  [/npm error/i, "❌ 依赖安装出错"],
  [/added \d+ packages/i, "✅ 依赖包安装完成"],
  [/listening on.*:?(\d+)/i, "✅ 服务已就绪，端口已打开"],
  [/server (is )?running/i, "✅ 服务正在运行"],
  [/EADDRINUSE/i, "❌ 端口被占用，请关闭占用程序后重试"],
  [/ECONNREFUSED/i, "❌ 连接被拒绝，检查网络设置"],
  [/ENOTFOUND/i, "❌ 域名解析失败，检查网络连接"],
  [/compiling/i, "⚙️ 正在编译..."],
  [/deprecated/i, "ℹ️ 有过时的依赖（不影响使用）"],
  [/ready in/i, "✅ 启动完成！"],
];

// Strip ANSI escape codes from terminal output
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "").replace(/\[[\d;]*m/g, "");
}

function humanizeLog(msg: string): string | undefined {
  for (const [pattern, translation] of LOG_TRANSLATIONS) {
    if (pattern.test(msg)) return translation;
  }
  return undefined;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s} s`;
  if (m > 0) return `${m}m ${s} s`;
  return `${s} s`;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  free: { label: "免费注册", icon: <Box size={14} /> },
  provider: { label: "Coding Plan", icon: <CreditCard size={14} /> },
  custom: { label: "自定义中转站", icon: <Wrench size={14} /> },
};

// ===== App =====
function App() {
  const [phase, setPhase] = useState<AppPhase>("checking");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("正在检查环境...");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [servicePort, setServicePort] = useState(18789);
  const [workspacePath, setWorkspacePath] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "logs" | "about">("general");
  const logRef = useRef<HTMLDivElement>(null);
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Model/Config state
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("free");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState("");
  const [currentConfig, setCurrentConfig] = useState<CurrentConfig | null>(null);

  // Mandatory API Key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showModelSwitchModal, setShowModelSwitchModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");

  const addLog = (level: string, message: string) => {
    const now = new Date();
    const time = now.toTimeString().split(" ")[0];
    const humanized = humanizeLog(message);
    setLogs((prev) => [...prev, { time, level, message, humanized }]);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    checkEnvironment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await invoke<ProviderInfo[]>("get_providers");
      setProviders(data);
      if (data.length > 0) {
        setSelectedProvider(data[0].id);
        if (data[0].models.length > 0) {
          setSelectedModel(`${data[0].id}/${data[0].models[0].id}`);
        }
      }
    } catch (err) {
      console.error("Failed to load providers:", err);
    }
  };

  const fetchConfigStatus = async () => {
    try {
      const status = await invoke<CurrentConfig>("check_api_configuration");
      setCurrentConfig(status);
      if (!status.has_api_key) {
        setShowKeyModal(true);
      }
      return status;
    } catch (err) {
      console.error("Failed to check config:", err);
      return null;
    }
  };

  const checkEnvironment = async () => {
    try {
      setPhase("checking");
      setProgress(10);
      setProgressMsg("正在读取系统配置...");
      await new Promise(r => setTimeout(r, 500));

      const port = await invoke<number>("get_service_port");
      setServicePort(port);
      setProgress(40);
      setProgressMsg("检查依赖...");
      await new Promise(r => setTimeout(r, 500));

      const wsPath = await invoke<string>("get_workspace_path");
      if (wsPath) {
        setWorkspacePath(wsPath);
        setProgress(70);
        setProgressMsg("加载模型提供商...");
        await fetchProviders();
        setProgress(90);
        setProgressMsg("验证 API Key...");
        const cfg = await fetchConfigStatus();
        setProgress(100);
        setProgressMsg("准备就绪");
        await new Promise(r => setTimeout(r, 400));
        setPhase("ready");
        if (!cfg?.has_api_key) {
          setShowKeyModal(true);
        }
      } else {
        setPhase("workspace");
      }
    } catch (error) {
      console.error(error);
      addLog("error", `环境检查失败: ${error}`);
      setPhase("ready");
    }
  };

  const handleFolderSelect = async (forSwitching = false) => {
    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: "选择 OpenClaw 工作区目录"
    });

    if (selectedPath && !Array.isArray(selectedPath)) {
      setWorkspacePath(selectedPath);
      if (forSwitching) {
        try {
          await invoke("set_workspace_path", { path: selectedPath });
          addLog("info", `工作区切换至: ${selectedPath}`);
        } catch (e) {
          addLog("error", `切换工作区失败: ${e}`);
        }
      }
    }
  };

  const handleSaveWorkspace = async () => {
    if (!workspacePath) return;
    try {
      await invoke("set_workspace_path", { path: workspacePath });
      await fetchProviders();
      await fetchConfigStatus();
      setPhase("ready");
    } catch (e) {
      console.error(e);
      addLog("error", `保存工作区失败: ${e}`);
    }
  };

  useEffect(() => {
    const unlistenOut = listen<string>("service-stdout", (event) => {
      addLog("info", stripAnsi(event.payload));
      if (event.payload.includes("Ready on")) {
        setRunning(true);
        setLoading(false);
      }
    });

    const unlistenErr = listen<string>("service-stderr", (event) => {
      addLog("error", stripAnsi(event.payload));
    });

    const unlistenStatus = listen<{ "status": string }>("service-status", (event) => {
      if (event.payload.status === "stopped" || event.payload.status === "crashed") {
        setRunning(false);
        setLoading(false);
        if (event.payload.status === "crashed") {
          addLog("error", "⚠️ 服务异常停止");
        } else {
          addLog("info", "服务已停止");
        }
      }
    });

    return () => {
      unlistenOut.then(f => f());
      unlistenErr.then(f => f());
      unlistenStatus.then(f => f());
    };
  }, []);

  useEffect(() => {
    if (running) {
      uptimeRef.current = setInterval(() => {
        setUptime(prev => prev + 1);
      }, 1000);
    } else {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
      setUptime(0);
    }
    return () => {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, [running]);

  const handleStart = async () => {
    setLoading(true);
    addLog("info", "正在启动服务...");
    try {
      await invoke("start_service");
      setRunning(true);
      setLoading(false);
    } catch (error) {
      console.error(error);
      addLog("error", `启动失败: ${error}`);
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    addLog("info", "正在停止服务...");
    try {
      await invoke("stop_service");
      setRunning(false);
      setLoading(false);
    } catch (error) {
      console.error(error);
      addLog("error", `停止失败: ${error}`);
      setLoading(false);
    }
  };

  const handleSwitchWorkspace = () => {
    handleFolderSelect(true);
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    try {
      await invoke("reset_config");
      addLog("info", "已清除 API Key 与模型配置");
      await fetchConfigStatus();
      setShowResetModal(false);
      setShowKeyModal(true);
    } catch (e) {
      addLog("error", `重置失败: ${e}`);
    }
  };

  const handleSaveConfig = async () => {
    if (selectedCategory === "free" || selectedCategory === "provider") {
      if (!apiKeyInput.trim()) {
        setConfigStatus("错误：API Key 不能为空");
        return;
      }
    } else if (selectedCategory === "custom") {
      if (!baseUrlInput.trim() || !apiKeyInput.trim()) {
        setConfigStatus("错误：接口地址与 API Key 均不能为空");
        return;
      }
    }

    setConfigSaving(true);
    setConfigStatus("正在保存配置...");

    try {
      if (selectedCategory === "custom") {
        await invoke("save_api_configuration", {
          provider: "custom",
          apiKey: apiKeyInput.trim(),
          baseUrl: baseUrlInput.trim(),
          model: selectedModel.trim() || "gpt-3.5-turbo"
        });
      } else {
        await invoke("save_api_configuration", {
          provider: selectedProvider,
          apiKey: apiKeyInput.trim(),
          baseUrl: null,
          model: selectedModel
        });
      }

      await fetchConfigStatus();
      setConfigStatus("✅ 配置保存成功！");
      setTimeout(() => {
        setShowKeyModal(false);
        setConfigStatus("");
      }, 1500);

    } catch (err) {
      setConfigStatus(`❌ 保存失败: ${err}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSetModel = async (fullModelId: string) => {
    try {
      const parts = fullModelId.split('/');
      const providerStr = parts[0];
      await invoke("save_api_configuration", {
        provider: providerStr,
        apiKey: currentConfig?.has_api_key ? "" : null, // Backend respects existing if ""
        baseUrl: null,
        model: fullModelId
      });
      await fetchConfigStatus();
    } catch (e) {
      addLog("error", `模型切换失败: ${e}`);
    }
  };


  // Providers by category
  const filteredProviders = providers.filter(p => p.category === selectedCategory);
  const currentProviderName = providers.find(p => p.id === currentConfig?.provider)?.name || currentConfig?.provider || "未配置";
  const currentModelName = currentConfig?.model ? currentConfig.model.split('/').pop() : "未配置";

  // ===== Mandatory API Key Modal =====
  const renderKeyModal = () => {
    const isDirectConfig = activeTab === "models" && selectedProvider && selectedCategory !== "custom";

    return (
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            className="modal-overlay"
            onClick={() => { if (currentConfig?.has_api_key) setShowKeyModal(false); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={20} className="text-accent" />
                {isDirectConfig ? `配置 ${providers.find(p => p.id === selectedProvider)?.name}` : "配置 AI 模型验证凭证"}
              </div>
              {!isDirectConfig && (
                <div className="modal-desc">
                  驱动 OpenClaw 需要配置有效的 API Key。系统推荐使用零成本的免费提供商。
                </div>
              )}

              {/* Only show category tabs if not opened directly from a provider card */}
              {!isDirectConfig && (
                <div className="category-tabs" style={{ marginBottom: 20 }}>
                  {Object.keys(CATEGORY_LABELS).map((catKey) => (
                    <button
                      key={catKey}
                      className={`category-btn ${selectedCategory === catKey ? "active" : ""}`}
                      onClick={() => {
                        setSelectedCategory(catKey);
                        if (catKey !== "custom") {
                          const firstId = providers.find(p => p.category === catKey)?.id;
                          if (firstId) {
                            setSelectedProvider(firstId);
                            const activeModels = providers.find(p => p.id === firstId)?.models;
                            if (activeModels && activeModels.length > 0) {
                              setSelectedModel(`${firstId}/${activeModels[0].id}`);
                            }
                          }
                        }
                      }}
                    >
                      {CATEGORY_LABELS[catKey].icon} {CATEGORY_LABELS[catKey].label}
                    </button>
                  ))}
                </div>
              )}

              {/* Content based on category */}
              {selectedCategory === "custom" ? (
                <div className="provider-form" style={{ background: "var(--bg-input)", padding: 16, borderRadius: "var(--radius)" }}>
                  <div className="form-group">
                    <label>API Base URL</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="https://api.openai.com/v1"
                      value={baseUrlInput}
                      onChange={e => setBaseUrlInput(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="sk-..."
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>模型 ID (可选)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="gpt-3.5-turbo 等，留空将尝试默认"
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="provider-form">
                  {!isDirectConfig && (
                    <div className="provider-select-list" style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>选择服务商</label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxHeight: 120, overflowY: "auto" }}>
                        {filteredProviders.map(p => (
                          <button
                            key={p.id}
                            className={`provider-pill ${selectedProvider === p.id ? "active" : ""}`}
                            onClick={() => {
                              setSelectedProvider(p.id);
                              if (p.models.length > 0) {
                                setSelectedModel(`${p.id}/${p.models[0].id}`);
                              }
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="active-provider-box">
                    <div className="provider-title-row">
                      <strong>配置 {providers.find(p => p.id === selectedProvider)?.name || selectedProvider}</strong>
                      {providers.find(p => p.id === selectedProvider)?.register_url && (
                        <button className="btn-link" onClick={() => invoke("open_url", { url: providers.find(p => p.id === selectedProvider)!.register_url })}>
                          🔗 点击此处注册获取免费 API Key &rarr;
                        </button>
                      )}
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>粘贴 API Key</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="在此粘贴以 sk- 开头的密钥..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>选择验证模型</label>
                      <div className="model-select-group">
                        {providers.find(p => p.id === selectedProvider)?.models.map(m => (
                          <button
                            key={m.id}
                            className={`model-select-btn ${selectedModel === `${selectedProvider}/${m.id}` ? "active" : ""}`}
                            onClick={() => setSelectedModel(`${selectedProvider}/${m.id}`)}
                          >
                            {m.name} {m.is_free ? <span className="free-tag">免费</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {configStatus && (
                <div className={`config-status ${configStatus.includes("✅") ? "success" : "error"}`}>
                  {configStatus}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                {currentConfig?.has_api_key && (
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowKeyModal(false)} disabled={configSaving}>
                    取消
                  </button>
                )}
                <button
                  className="btn-primary"
                  style={{ flex: currentConfig?.has_api_key ? 2 : 1 }}
                  onClick={handleSaveConfig}
                  disabled={configSaving}
                >
                  {configSaving ? "保存中..." : (currentConfig?.has_api_key ? "保存修改" : "✅ 保存并开始使用")}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (phase === "checking" || phase === "initializing") {
    return (
      <div className="startup-container">
        <motion.div
          className="startup-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="startup-logo">OpenClaw Launcher</div>
          <div className="startup-progress-bar">
            {/* Smooth progress bar width via motion */}
            <motion.div
              className="startup-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <div className="startup-text">{progressMsg}</div>
        </motion.div>
      </div>
    );
  }

  if (phase === "workspace") {
    return (
      <div className="startup-container">
        <motion.div
          className="startup-box"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="startup-logo">工作区配置</div>
          <p className="modal-desc" style={{ marginBottom: 20, textAlign: 'center' }}>
            OpenClaw 需要一个工作区（文件夹）来存放代码和配置。
          </p>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <div className="path-display" style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
              {workspacePath || "尚未选择"}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => handleFolderSelect(false)}>浏览...</button>
            <button className="btn-primary" onClick={handleSaveWorkspace} disabled={!workspacePath}>
              确认并继续
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Dynamic Header */}
      <Header running={running} phase={phase} statusClass={running ? 'running' : 'stopped'} />

      {/* Premium Navbar */}
      <nav className="tab-nav">
        {(
          [
            { id: "dashboard", label: "仪表盘", icon: <Activity size={18} strokeWidth={1.5} /> },
            { id: "models", label: "AI 引擎", icon: <Network size={18} strokeWidth={1.5} /> },
            { id: "settings", label: "设置中心", icon: <SlidersHorizontal size={18} strokeWidth={1.5} /> },
          ] as { id: TabId, label: string, icon: React.ReactNode }[]
        ).map((tab) => (
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
                <div className="status-ring-container">
                  <div className={`status-ring ${running ? 'active' : ''}`} />
                  <div className="status-center-icon">
                    <Box size={24} className="text-primary" />
                  </div>
                </div>
                <h1 className="hero-title">{running ? "引擎已在云端就绪" : "引擎已就绪"}</h1>
                <p className="hero-subtitle">
                  {running ? "核心服务正在持续保护与加速您的开发体验" : "点击下方按钮启动本地 AI 驱动核心"}
                </p>

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
                    <div className="stat-label">驱动引擎 (点击切换)</div>
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
                    <div className="stat-label">连续工作时长</div>
                    <div className="stat-value">{running ? formatUptime(uptime) : "休眠中"}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Models Tab ===== */}
          {
            activeTab === "models" && (
              <motion.div
                key="models"
                className="models-page"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Network size={22} className="text-accent" /> 引擎阵列配置
                </h2>
                <p className="page-desc">部署算力节点与验证凭证，唤醒 OpenClaw 核心能力。</p>

                <div className="category-tabs">
                  {Object.keys(CATEGORY_LABELS).map((catKey) => (
                    <button
                      key={catKey}
                      className={`category-btn ${selectedCategory === catKey ? "active" : ""}`}
                      onClick={() => setSelectedCategory(catKey)}
                    >
                      {CATEGORY_LABELS[catKey].icon} {CATEGORY_LABELS[catKey].label}
                    </button>
                  ))}
                </div>

                {selectedCategory === "custom" ? (
                  <div className="provider-grid">
                    <div className="provider-card custom-card">
                      <div className="provider-header">
                        <div className="provider-name">🔧 自定义 API Endpoint</div>
                      </div>
                      <div className="provider-desc">连接到你自己的中转 API 或本地兼容服务 (如 Ollama/LMStudio)</div>
                      <button className="btn-quick" style={{ marginTop: 12, width: '100%' }} onClick={() => setShowKeyModal(true)}>
                        配置自定义地址
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="provider-grid">
                    {filteredProviders.map(p => (
                      <div
                        key={p.id}
                        className={`provider-card ${currentConfig?.provider === p.id ? "active-provider" : ""}`}
                        onClick={() => {
                          setSelectedProvider(p.id);
                          setShowKeyModal(true);
                        }}
                      >
                        <div className="provider-header">
                          <div className="provider-name">{p.name} {p.category === 'free' ? <span className="free-tag">免费</span> : null}</div>
                        </div>
                        <div className="provider-desc">{p.description}</div>
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
            )
          }

          {/* ===== Settings Tab ===== */}
          {
            activeTab === "settings" && (
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

                      <div className="setting-item setting-danger" style={{ marginTop: 24 }}>
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
                            logs.slice(-20).map((log, i) => { // Only show latest 20 to keep it slick
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
              </motion.div>
            )
          }
        </AnimatePresence>
      </div>

      {/* Generic Info / QR Code Modal */}
      <AnimatePresence>
        {infoModalTitle && (
          <motion.div
            className="modal-overlay"
            onClick={() => setInfoModalTitle("")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-box"
              style={{ maxWidth: 360, textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              <div className="modal-title">{infoModalTitle}</div>
              <div className="modal-desc" style={{ marginTop: 16, marginBottom: 24, padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                <div style={{ color: 'var(--text-muted)' }}>[ 二维码图片占位符 ]</div>
                <div style={{ fontSize: 12, marginTop: 12 }}>请在 assets 文件夹替换为你个人的二维码图片</div>
              </div>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setInfoModalTitle("")}>关闭</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Switch Modal */}
      <AnimatePresence>
        {showModelSwitchModal && (
          <motion.div
            className="modal-overlay"
            onClick={() => setShowModelSwitchModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-box"
              style={{ maxWidth: 400 }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              <div className="modal-title">🔄 切换模型</div>
              <div className="modal-desc">选择要使用的 AI 模型</div>
              {currentConfig && currentConfig.provider ? (
                <div className="model-switch-list" style={{ marginTop: 12 }}>
                  {providers.find(p => currentConfig && p.id === currentConfig.provider)?.models.map((m) => (
                    <button
                      key={m.id}
                      className={`model-switch-item ${currentConfig?.model?.endsWith(m.id) ? "active" : ""}`}
                      onClick={async () => {
                        const fullModelId = `${currentConfig?.provider}/${m.id}`;
                        await handleSetModel(fullModelId);
                        setShowModelSwitchModal(false);
                      }}
                    >
                      <span className="model-switch-name">{m.name}</span>
                      {currentConfig?.model?.endsWith(m.id) && <span className="model-switch-badge">当前</span>}
                    </button>
                  )) || <div style={{ color: "var(--text-secondary)" }}>暂无可用模型</div>}
                </div>
              ) : (
                <div style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                  请先在「模型」标签页配置 API 提供商
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setShowModelSwitchModal(false)}>关闭</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-box"
              style={{ maxWidth: 420 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-title">⚠️ 重置配置</div>
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
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setShowResetModal(false)}>取消</button>
                <button className="btn-danger" onClick={confirmReset}>确认重置</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory API Key Modal */}
      {renderKeyModal()}
    </div>
  );
}

// ===== Header Component =====
function Header({ running, phase, statusClass }: {
  running: boolean; phase: string; statusClass: string;
}) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">OpenClaw Launcher</span>
        <span className="header-version">v0.3.1</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {phase === "ready" && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {running ? "运行中" : "已停止"}
          </span>
        )}
        <span className={`status-dot ${statusClass}`} />
      </div>
    </header>
  );
}

export default App;
