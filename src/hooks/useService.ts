/**
 * useService Hook
 *
 * Manages service lifecycle: start, stop, environment checking,
 * workspace setup, event listeners for progress/heartbeat/port.
 * All Tauri command calls match the actual backend API exactly.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppPhase } from "../types";

interface UseServiceOptions {
    addLog: (level: string, message: string) => void;
    checkApiKey: () => Promise<void>;
    setRepairToast: (show: boolean) => void;
    running: boolean;
    setRunning: (r: boolean) => void;
}

export function useService({ addLog, checkApiKey, setRepairToast, running, setRunning }: UseServiceOptions) {
    const [phase, setPhase] = useState<AppPhase>("checking");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("正在检查环境...");
    const [uptime, setUptime] = useState(0);
    const [servicePort, setServicePort] = useState(18789);
    const [workspacePath, setWorkspacePath] = useState("");
    const [reinstalling, setReinstalling] = useState(false);
    const [repairing, setRepairing] = useState(false);
    const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Uptime counter
    useEffect(() => {
        if (running) {
            setUptime(0);
            uptimeRef.current = setInterval(() => setUptime((u) => u + 1), 1000);
        } else {
            if (uptimeRef.current) clearInterval(uptimeRef.current);
            setUptime(0);
        }
        return () => { if (uptimeRef.current) clearInterval(uptimeRef.current); };
    }, [running]);

    const runSetup = useCallback(async () => {
        setLoading(true);
        try {
            await invoke("setup_openclaw");
            setPhase("ready");
            addLog("success", "🎉 OpenClaw 初始化完成！");
            await checkApiKey();
        } catch (err) {
            addLog("error", `初始化失败: ${err}`);
            setProgressMsg(`❌ 初始化失败: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [addLog, checkApiKey]);

    const checkEnvironment = useCallback(async () => {
        try {
            const nodeOk = await invoke<boolean>("check_node_exists");
            const openclawOk = await invoke<boolean>("check_openclaw_exists");
            const modulesOk = await invoke<boolean>("check_node_modules_exists");
            const serviceRunning = await invoke<boolean>("is_service_running");

            if (nodeOk && openclawOk && modulesOk) {
                const configOk = await invoke<boolean>("check_config_exists");
                if (!configOk) {
                    setPhase("workspace");
                    addLog("info", "首次使用，请选择工作区目录");
                } else {
                    setPhase("ready");
                    setRunning(serviceRunning);
                    addLog("success", "✅ 环境检查通过，所有组件就绪");
                    await checkApiKey();
                }
            } else {
                setPhase("initializing");
                addLog("info", "首次启动，开始初始化环境...");
                await runSetup();
            }
        } catch (err) {
            addLog("error", `环境检查失败: ${err}`);
            setPhase("initializing");
            await runSetup();
        }
    }, [addLog, checkApiKey, runSetup]);

    // On mount: check environment + register event listeners
    useEffect(() => {
        checkEnvironment();

        const unlistenProgress = listen<{ stage: string; message: string; percent: number }>(
            "setup-progress",
            (event) => {
                setProgress(event.payload.percent);
                setProgressMsg(event.payload.message);
                addLog("info", event.payload.message);
            }
        );

        const unlistenLogs = listen<{ level: string; message: string }>(
            "service-log",
            (event) => addLog(event.payload.level, event.payload.message)
        );

        const unlistenHeartbeat = listen("service-heartbeat", async () => {
            try {
                const alive = await invoke<boolean>("is_service_running");
                if (!alive) {
                    setRunning(false);
                    addLog("error", "⚠️ OpenClaw 服务进程已意外退出");
                }
            } catch { /* ignore */ }
        });

        const unlistenPort = listen<{ port: number }>(
            "service-port",
            (event) => setServicePort(event.payload.port)
        );

        return () => {
            unlistenProgress.then((fn) => fn());
            unlistenLogs.then((fn) => fn());
            unlistenHeartbeat.then((fn) => fn());
            unlistenPort.then((fn) => fn());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectFolder = useCallback(async () => {
        const selected = await open({ directory: true, multiple: false, title: "选择你的工作区目录" });
        if (selected && typeof selected === "string") setWorkspacePath(selected);
    }, []);

    const handleConfirmWorkspace = useCallback(async () => {
        setLoading(true);
        try {
            await invoke("inject_default_config");
            await invoke("inject_default_models");
            addLog("success", `✅ 工作区已配置: ${workspacePath || "默认目录"}`);
            setPhase("ready");
            await checkApiKey();
        } catch (err) {
            addLog("error", `配置失败: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [addLog, checkApiKey, workspacePath]);

    const handleSwitchWorkspace = useCallback(async () => {
        const selected = await open({ directory: true, multiple: false, title: "切换工作区目录" });
        if (selected && typeof selected === "string") {
            setWorkspacePath(selected);
            setLoading(true);
            try {
                await invoke("inject_default_config");
                addLog("success", `✅ 工作区已切换到: ${selected}`);
            } catch (err) {
                addLog("error", `切换失败: ${err}`);
            } finally {
                setLoading(false);
            }
        }
    }, [addLog]);

    const handleStart = useCallback(async () => {
        setLoading(true);
        try {
            await invoke("start_service");
            setRunning(true);
        } catch (err) {
            addLog("error", `启动失败: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const handleStop = useCallback(async () => {
        setLoading(true);
        try {
            await invoke("stop_service");
            setRunning(false);
        } catch (err) {
            addLog("error", `停止失败: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const confirmReinstall = useCallback(async () => {
        setReinstalling(true);
        setPhase("initializing");
        setProgress(0);
        setProgressMsg("正在清理并重新安装...");
        try {
            await invoke("reinstall_environment");
            setPhase("ready");
            addLog("success", "🎉 环境重新安装完成！");
            await checkApiKey();
        } catch (err) {
            addLog("error", `重新安装失败: ${err}`);
            setProgressMsg(`❌ 重新安装失败: ${err}`);
        } finally {
            setReinstalling(false);
        }
    }, [addLog, checkApiKey]);

    const handleRepairConnection = useCallback(async () => {
        setRepairing(true);
        setRepairToast(false);
        addLog("info", "🔧 开始一键修复连接...");
        try {
            // Step 1: Stop service if running
            if (running) {
                addLog("info", "正在停止服务...");
                await invoke("stop_service");
                setRunning(false);
                await new Promise(r => setTimeout(r, 1500));
            }
            // Step 2: Restart service
            addLog("info", "正在重新启动服务...");
            await invoke("start_service");
            setRunning(true);
            await new Promise(r => setTimeout(r, 2000));
            // Step 3: Open browser with cache-busting timestamp
            const ts = Date.now();
            await invoke("open_url", { url: `http://localhost:${servicePort}?token=openclaw-launcher-local&_t=${ts}` });
            addLog("success", "✅ 连接修复完成，已重新打开浏览器");
        } catch (err) {
            addLog("error", `修复失败: ${err}`);
        } finally {
            setRepairing(false);
        }
    }, [addLog, running, servicePort, setRepairToast]);

    return {
        phase,
        loading,
        progress, progressMsg,
        uptime, servicePort,
        workspacePath,
        reinstalling, repairing,
        handleSelectFolder,
        handleConfirmWorkspace,
        handleSwitchWorkspace,
        handleStart,
        handleStop,
        confirmReinstall,
        handleRepairConnection,
    };
}
