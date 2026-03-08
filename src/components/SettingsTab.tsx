import { invoke } from "@tauri-apps/api/core";
import { Settings as SettingsIcon, Box, Hexagon, Github, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { CurrentConfig, LogEntry } from "../types";
import React from "react";

interface SettingsTabProps {
    activeSettingsTab: "general" | "logs" | "about";
    setActiveSettingsTab: (v: "general" | "logs" | "about") => void;
    workspacePath: string;
    servicePort: number;
    currentConfig: CurrentConfig | null;
    running: boolean;
    reinstalling: boolean;
    repairing: boolean;
    logs: LogEntry[];
    showRawLogs: boolean;
    setShowRawLogs: (v: boolean) => void;
    logRef: React.RefObject<HTMLDivElement | null>;
    handleSwitchWorkspace: () => void;
    handleReinstall: () => void;
    handleRepairConnection: () => void;
    handleReset: () => void;
    setShowKeyModal: (v: boolean) => void;
    setInfoModalTitle: (v: string) => void;
}

export function SettingsTab({
    activeSettingsTab, setActiveSettingsTab,
    workspacePath, servicePort, currentConfig,
    reinstalling, repairing,
    logs, showRawLogs, setShowRawLogs, logRef,
    handleSwitchWorkspace, handleReinstall, handleRepairConnection, handleReset,
    setShowKeyModal, setInfoModalTitle,
}: SettingsTabProps) {
    return (
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
    );
}
