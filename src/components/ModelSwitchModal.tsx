// Copyright (C) 2026 ZsTs119
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of OpenClaw Launcher. See LICENSE for details.
import { useState } from "react";
import { Modal, ModalFooter } from "./ui/Modal";
import type { ProviderInfo, CurrentConfig } from "../types";
import { ModelSelectWithCustom } from "./ModelSelectWithCustom";

interface ModelSwitchModalProps {
    show: boolean;
    onClose: () => void;
    providers: ProviderInfo[];
    currentConfig: CurrentConfig | null;
    handleSetModel: (modelId: string) => Promise<void>;
}

export function ModelSwitchModal({
    show, onClose, providers, currentConfig, handleSetModel,
}: ModelSwitchModalProps) {
    // Track the locally selected model (visual state)
    const currentModelId = currentConfig?.model?.includes("/")
        ? currentConfig.model.split("/").slice(1).join("/")
        : currentConfig?.model || "";

    const [localSelected, setLocalSelected] = useState(currentModelId);

    const currentProvider = providers.find(p => p.id === currentConfig?.provider);
    const models = currentProvider?.models || [];

    // Reset local state when modal opens
    const effectiveSelected = localSelected || currentModelId;

    return (
        <Modal show={show} onClose={onClose} title="切换模型" maxWidth={400}>
            <div className="modal-desc">选择要使用的 AI 模型</div>
            {currentConfig?.provider ? (
                <div className="model-switch-list" style={{ marginTop: 12 }}>
                    <ModelSelectWithCustom
                        models={models}
                        selectedModel={effectiveSelected}
                        onSelect={(modelId) => {
                            setLocalSelected(modelId);
                        }}
                    />
                    <button
                        className="btn-primary"
                        style={{ width: '100%', marginTop: 12, padding: '10px' }}
                        onClick={async () => {
                            if (!effectiveSelected.trim()) return;
                            const fullModelId = `${currentConfig.provider}/${effectiveSelected.trim()}`;
                            await handleSetModel(fullModelId);
                            onClose();
                        }}
                        disabled={!effectiveSelected || effectiveSelected === currentModelId}
                    >
                        确认切换
                    </button>
                </div>
            ) : (
                <div style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                    请先在「AI 引擎」标签页配置模型提供商
                </div>
            )}
            <ModalFooter>
                <button className="btn-secondary" onClick={onClose}>关闭</button>
            </ModalFooter>
        </Modal>
    );
}
