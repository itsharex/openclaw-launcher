import { Modal, ModalFooter } from "./ui/Modal";
import type { ProviderInfo, CurrentConfig } from "../types";

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
    return (
        <Modal show={show} onClose={onClose} title="🔄 切换模型" maxWidth={400}>
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
                                onClose();
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
                <button className="btn-secondary" onClick={onClose}>关闭</button>
            </ModalFooter>
        </Modal>
    );
}
