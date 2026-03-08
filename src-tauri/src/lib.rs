mod config;
mod download;
mod environment;
mod installer;
mod paths;
mod service;
mod setup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(service::ServiceState::default())
        .invoke_handler(tauri::generate_handler![
            // Environment
            environment::check_node_exists,
            environment::download_and_install_node,
            environment::get_environment_info,
            // Download
            download::download_openclaw_source,
            // Installer
            installer::run_npm_install,
            // Setup orchestration
            setup::check_openclaw_exists,
            setup::check_node_modules_exists,
            setup::check_config_exists,
            setup::inject_default_config,
            setup::inject_default_models,
            setup::install_preset_skills,
            setup::setup_openclaw,
            setup::reinstall_environment,
            // Service lifecycle
            service::check_port_available,
            service::is_service_running,
            service::start_service,
            service::stop_service,
            // Config & API Key management
            config::get_providers,
            config::get_current_config,
            config::migrate_gateway_config,
            config::save_api_config,
            config::set_default_model,
            config::open_provider_register,
            config::open_url,
            config::reset_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
