#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod crypto;
mod db;

use crypto::CryptoState;
use single_instance::SingleInstance;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::{Emitter, Manager};

const WINDOW_LABEL: &str = "main";

fn main() {
    // 单实例运行
    let instance = SingleInstance::new("com.remember.passwordmanager").expect("单实例检测失败");
    if !instance.is_single() {
        std::process::exit(0);
    }

    db::init_db().expect("数据库初始化失败");

    tauri::Builder::default()
        .manage(CryptoState::new())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_initialized,
            commands::setup_master_password,
            commands::verify_master_password,
            commands::lock,
            commands::create_account,
            commands::update_account,
            commands::delete_account,
            commands::list_accounts,
            commands::get_account,
            commands::touch_account,
            commands::get_setting,
            commands::set_setting,
            commands::parse_csv_headers,
            commands::import_accounts_from_csv,
            commands::export_accounts_to_csv,
            commands::set_collapsed_mode,
            commands::set_expanded_mode,
            commands::exit_app,
            commands::launch_account_tool,
        ])
        .setup(|app| {
            let window = app.get_webview_window(WINDOW_LABEL).expect("主窗口未创建");
            let _ = window.set_skip_taskbar(true);

            // 创建托盘图标和菜单
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let toggle_i = MenuItem::with_id(app, "toggle", "展开 / 收起", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &PredefinedMenuItem::separator(app)?, &quit_i])?;

            let window_clone = window.clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Remember 密码管理器")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        let _ = window_clone.emit("app-exit", ());
                        app.exit(0);
                    }
                    "toggle" => {
                        let _ = window_clone.emit("toggle-expand", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window(WINDOW_LABEL) {
                            let _ = window.emit("toggle-expand", ());
                        }
                    }
                })
                .build(app)?;

            let initialized = db::has_master_password().unwrap_or(false);
            commands::position_window(&window, !initialized);
            let _ = window.show();
            if !initialized {
                let _ = window.set_focus();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("应用运行失败");
}


