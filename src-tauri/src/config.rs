use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::environment;

/// Provider categories for the UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderInfo {
    pub id: String,
    pub name: String,
    pub category: String, // "free", "paid", "custom"
    pub base_url: String,
    pub register_url: String,
    pub description: String,
    pub models: Vec<ModelInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub is_free: bool,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentConfig {
    pub has_api_key: bool,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub base_url: Option<String>,
}

/// Return the list of supported providers grouped by category
#[tauri::command]
pub fn get_providers() -> Vec<ProviderInfo> {
    vec![
        // ===== 🆓 免费注册 =====
        ProviderInfo {
            id: "nvidia".into(),
            name: "Nvidia (免费)".into(),
            category: "free".into(),
            base_url: "https://integrate.api.nvidia.com/v1".into(),
            register_url: "https://build.nvidia.com/explore/discover".into(),
            description: "免费注册，支持 Kimi K2.5、DeepSeek V3、GLM-4.7 等优质模型".into(),
            models: vec![
                ModelInfo { id: "nvidia/kimi-k2.5".into(), name: "Kimi K2.5".into(), provider: "nvidia".into(), is_free: true },
                ModelInfo { id: "nvidia/deepseek-v3.2".into(), name: "DeepSeek V3.2".into(), provider: "nvidia".into(), is_free: true },
                ModelInfo { id: "nvidia/glm-4.7".into(), name: "GLM 4.7".into(), provider: "nvidia".into(), is_free: true },
                ModelInfo { id: "nvidia/glm-4.7-flash".into(), name: "GLM 4.7 Flash".into(), provider: "nvidia".into(), is_free: true },
            ],
        },
        ProviderInfo {
            id: "openrouter".into(),
            name: "OpenRouter (免费额度)".into(),
            category: "free".into(),
            base_url: "https://openrouter.ai/api/v1".into(),
            register_url: "https://openrouter.ai/keys".into(),
            description: "免费注册，聚合多家模型，免费模型无限用".into(),
            models: vec![
                ModelInfo { id: "openrouter/google/gemini-2.0-flash-exp:free".into(), name: "Gemini 2.0 Flash (免费)".into(), provider: "openrouter".into(), is_free: true },
                ModelInfo { id: "openrouter/meta-llama/llama-4-maverick:free".into(), name: "Llama 4 Maverick (免费)".into(), provider: "openrouter".into(), is_free: true },
                ModelInfo { id: "openrouter/qwen/qwen3-235b-a22b:free".into(), name: "Qwen3 235B (免费)".into(), provider: "openrouter".into(), is_free: true },
            ],
        },
        ProviderInfo {
            id: "groq".into(),
            name: "Groq (免费)".into(),
            category: "free".into(),
            base_url: "https://api.groq.com/openai/v1".into(),
            register_url: "https://console.groq.com/keys".into(),
            description: "免费注册，超快推理速度，适合编程".into(),
            models: vec![
                ModelInfo { id: "llama-3.3-70b-versatile".into(), name: "Llama 3.3 70B".into(), provider: "groq".into(), is_free: true },
                ModelInfo { id: "gemma2-9b-it".into(), name: "Gemma2 9B".into(), provider: "groq".into(), is_free: true },
            ],
        },
        // ===== 💳 主流 Coding Plan =====
        ProviderInfo {
            id: "aliyun".into(),
            name: "阿里云百炼".into(),
            category: "paid".into(),
            base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1".into(),
            register_url: "https://bailian.console.aliyun.com/".into(),
            description: "首月 ¥7.9，支持 Qwen3/Qwen3-Coder 等模型".into(),
            models: vec![
                ModelInfo { id: "qwen3-coder".into(), name: "Qwen3 Coder".into(), provider: "aliyun".into(), is_free: false },
                ModelInfo { id: "qwen3-max".into(), name: "Qwen3 Max".into(), provider: "aliyun".into(), is_free: false },
                ModelInfo { id: "qwen3-plus".into(), name: "Qwen3 Plus".into(), provider: "aliyun".into(), is_free: false },
            ],
        },
        ProviderInfo {
            id: "bytedance".into(),
            name: "字节方舟".into(),
            category: "paid".into(),
            base_url: "https://ark.cn-beijing.volces.com/api/v3".into(),
            register_url: "https://www.volcengine.com/product/doubao".into(),
            description: "首月 ¥9.9，支持 Kimi K2.5、DeepSeek V3.2 等".into(),
            models: vec![
                ModelInfo { id: "doubao-kimi-k2.5".into(), name: "Kimi K2.5".into(), provider: "bytedance".into(), is_free: false },
                ModelInfo { id: "doubao-deepseek-v3.2".into(), name: "DeepSeek V3.2".into(), provider: "bytedance".into(), is_free: false },
            ],
        },
        ProviderInfo {
            id: "zhipu".into(),
            name: "智谱 GLM".into(),
            category: "paid".into(),
            base_url: "https://open.bigmodel.cn/api/paas/v4".into(),
            register_url: "https://open.bigmodel.cn/".into(),
            description: "¥49/月起，GLM-4.7 系列".into(),
            models: vec![
                ModelInfo { id: "glm-4.7".into(), name: "GLM 4.7".into(), provider: "zhipu".into(), is_free: false },
                ModelInfo { id: "glm-4.5".into(), name: "GLM 4.5".into(), provider: "zhipu".into(), is_free: false },
            ],
        },
        ProviderInfo {
            id: "deepseek".into(),
            name: "DeepSeek".into(),
            category: "paid".into(),
            base_url: "https://api.deepseek.com/v1".into(),
            register_url: "https://platform.deepseek.com/api_keys".into(),
            description: "按量付费，DeepSeek V3/R1 编程利器".into(),
            models: vec![
                ModelInfo { id: "deepseek-chat".into(), name: "DeepSeek V3".into(), provider: "deepseek".into(), is_free: false },
                ModelInfo { id: "deepseek-reasoner".into(), name: "DeepSeek R1".into(), provider: "deepseek".into(), is_free: false },
            ],
        },
        ProviderInfo {
            id: "openai".into(),
            name: "OpenAI".into(),
            category: "paid".into(),
            base_url: "https://api.openai.com/v1".into(),
            register_url: "https://platform.openai.com/api-keys".into(),
            description: "按量付费，GPT-4o / o3 系列".into(),
            models: vec![
                ModelInfo { id: "gpt-4o".into(), name: "GPT-4o".into(), provider: "openai".into(), is_free: false },
                ModelInfo { id: "gpt-4o-mini".into(), name: "GPT-4o Mini".into(), provider: "openai".into(), is_free: false },
                ModelInfo { id: "o3-mini".into(), name: "o3 Mini".into(), provider: "openai".into(), is_free: false },
            ],
        },
        ProviderInfo {
            id: "kimi".into(),
            name: "Kimi Code (月之暗面)".into(),
            category: "paid".into(),
            base_url: "https://api.moonshot.cn/v1".into(),
            register_url: "https://platform.moonshot.cn/console/api-keys".into(),
            description: "¥49/月起，Kimi 工具生态".into(),
            models: vec![
                ModelInfo { id: "moonshot-v1-8k".into(), name: "Kimi v1 8K".into(), provider: "kimi".into(), is_free: false },
                ModelInfo { id: "moonshot-v1-32k".into(), name: "Kimi v1 32K".into(), provider: "kimi".into(), is_free: false },
            ],
        },
    ]
}

/// Get current OpenClaw config status
#[tauri::command]
pub fn get_current_config() -> Result<CurrentConfig, String> {
    let openclaw_dir = crate::openclaw::get_openclaw_dir()?;
    let config_path = openclaw_dir.join("openclaw.json");

    if !config_path.exists() {
        return Ok(CurrentConfig {
            has_api_key: false,
            provider: None,
            model: None,
            base_url: None,
        });
    }

    // Read the config file
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取配置失败: {}", e))?;

    // Simple JSON parsing — look for key fields
    // OpenClaw uses JSON5 so we do basic string matching
    let has_key = content.contains("apiKey") || content.contains("api_key");

    // Try to extract model
    let model = extract_json_value(&content, "model");
    let provider = extract_json_value(&content, "provider");

    Ok(CurrentConfig {
        has_api_key: has_key,
        provider,
        model,
        base_url: None,
    })
}

/// Save API key config — writes to OpenClaw's config system
#[tauri::command]
pub fn save_api_config(
    app: tauri::AppHandle,
    provider: String,
    api_key: String,
    base_url: Option<String>,
    model: Option<String>,
) -> Result<String, String> {
    let openclaw_dir = crate::openclaw::get_openclaw_dir()?;
    let node_bin = environment::get_node_binary()?;
    let run_script = openclaw_dir.join("scripts").join("run-node.mjs");

    // Build sandbox PATH
    let sandbox_path = {
        let mut paths = vec![node_bin.parent().unwrap().to_path_buf()];
        if let Some(current) = std::env::var_os("PATH") {
            paths.extend(std::env::split_paths(&current));
        }
        std::env::join_paths(paths).unwrap_or_default()
    };

    // Helper: run openclaw config set
    let run_config = |key: &str, value: &str| -> Result<(), String> {
        let mut cmd = std::process::Command::new(&node_bin);
        cmd.arg(&run_script)
            .arg("config")
            .arg("set")
            .arg(key)
            .arg(value)
            .current_dir(&openclaw_dir)
            .env("PATH", &sandbox_path)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000);
        }

        let output = cmd.output()
            .map_err(|e| format!("执行配置命令失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Don't fail on config set errors — some keys may not exist
            eprintln!("config set {} warning: {}", key, stderr);
        }
        Ok(())
    };

    // Get provider info for base URL
    let providers = get_providers();
    let provider_info = providers.iter().find(|p| p.id == provider);
    let effective_base_url = base_url.clone().or_else(|| provider_info.map(|p| p.base_url.clone()));

    // Set the API key via openclaw config
    let _ = run_config(&format!("providers.{}.apiKey", provider), &api_key);

    // Set base URL if custom
    if let Some(url) = &effective_base_url {
        let _ = run_config(&format!("providers.{}.baseUrl", provider), url);
    }

    // Set default model if provided
    if let Some(model_id) = &model {
        let _ = run_config("agents.defaults.model", model_id);
    }

    // Also write to openclaw.json directly as a fallback
    let config_path = openclaw_dir.join("openclaw.json");
    write_provider_config(&config_path, &provider, &api_key, effective_base_url.as_deref(), model.as_deref())?;

    let _ = app.emit("config-updated", serde_json::json!({
        "provider": provider,
        "hasKey": true,
        "model": model,
    }));

    Ok(format!("✅ {} 配置已保存", provider_info.map(|p| p.name.as_str()).unwrap_or(&provider)))
}

/// Set the default model
#[tauri::command]
pub fn set_default_model(
    app: tauri::AppHandle,
    model_id: String,
) -> Result<String, String> {
    let openclaw_dir = crate::openclaw::get_openclaw_dir()?;
    let node_bin = environment::get_node_binary()?;
    let run_script = openclaw_dir.join("scripts").join("run-node.mjs");

    let mut cmd = std::process::Command::new(&node_bin);
    cmd.arg(&run_script)
        .arg("config")
        .arg("set")
        .arg("agents.defaults.model")
        .arg(&model_id)
        .current_dir(&openclaw_dir)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    if let Some(current_path) = std::env::var_os("PATH") {
        let mut paths = std::env::split_paths(&current_path).collect::<Vec<_>>();
        paths.insert(0, node_bin.parent().unwrap().to_path_buf());
        let new_path = std::env::join_paths(paths).unwrap_or_default();
        cmd.env("PATH", new_path);
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let _ = cmd.output();

    let _ = app.emit("config-updated", serde_json::json!({
        "model": model_id,
    }));

    Ok(format!("✅ 默认模型已切换为: {}", model_id))
}

/// Open a provider's registration page
#[tauri::command]
pub fn open_provider_register(provider_id: String) -> Result<String, String> {
    let providers = get_providers();
    if let Some(provider) = providers.iter().find(|p| p.id == provider_id) {
        let _ = open::that(&provider.register_url);
        Ok(format!("已打开 {} 注册页面", provider.name))
    } else {
        Err(format!("未知的提供商: {}", provider_id))
    }
}

// ===== Helper functions =====

/// Write provider config directly to openclaw.json
fn write_provider_config(
    config_path: &std::path::Path,
    provider: &str,
    api_key: &str,
    base_url: Option<&str>,
    model: Option<&str>,
) -> Result<(), String> {
    // Read existing config or use default
    let _existing = if config_path.exists() {
        std::fs::read_to_string(config_path).unwrap_or_default()
    } else {
        String::new()
    };

    // If config has content, try to merge. Otherwise write fresh.
    // For simplicity, we write a complete config with all settings
    let workspace = dirs::document_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Documents"))
        .join("OpenClaw-Projects");
    let _ = std::fs::create_dir_all(&workspace);

    let model_line = model.unwrap_or("openrouter/google/gemini-2.0-flash-exp:free");
    let base_url_line = base_url.unwrap_or("");

    let config_content = format!(r#"{{
  // OpenClaw Launcher 自动生成的配置 (v2 - 含 API Key)
  "agents": {{
    "defaults": {{
      "model": "{}",
      "models": [
        "{}"
      ]
    }}
  }},
  "providers": {{
    "{}": {{
      "apiKey": "{}",
      "baseUrl": "{}"
    }}
  }},
  "gateway": {{
    "mode": "local",
    "auth": {{
      "token": "openclaw-launcher-local"
    }}
  }},
  "sandbox": {{
    "paths": [
      "{}"
    ]
  }}
}}"#, 
    model_line,
    model_line,
    provider,
    api_key,
    base_url_line,
    workspace.to_string_lossy().replace('\\', "\\\\")
    );

    std::fs::write(config_path, &config_content)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    Ok(())
}

/// Extract a simple string value from JSON-like content by key
fn extract_json_value(content: &str, key: &str) -> Option<String> {
    let pattern = format!("\"{}\"", key);
    if let Some(pos) = content.find(&pattern) {
        let after = &content[pos + pattern.len()..];
        // Find the value after ":"
        if let Some(colon_pos) = after.find(':') {
            let value_part = after[colon_pos + 1..].trim();
            if value_part.starts_with('"') {
                if let Some(end) = value_part[1..].find('"') {
                    return Some(value_part[1..end + 1].to_string());
                }
            }
        }
    }
    None
}
