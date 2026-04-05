use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

pub fn open_settings_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let _ = WebviewWindowBuilder::new(&app, "settings", WebviewUrl::App("pages/settings.html".into()))
        .title("设置")
        .inner_size(600.0, 500.0)
        .resizable(false)
        .build();
}

pub fn open_update_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("update") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let _ = WebviewWindowBuilder::new(&app, "update", WebviewUrl::App("pages/update.html".into()))
        .title("检查更新")
        .inner_size(400.0, 300.0)
        .resizable(false)
        .build();
}

pub fn handle_menu_event(app: AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "settings" => {
            open_settings_window(app.clone());
        }
        "check_update" => {
            open_update_window(app.clone());
        }
        "about" => {
            use tauri_plugin_dialog::DialogExt;
            app.dialog()
                .message("Medex\n版本：0.1.0\n\n一个现代化的媒体管理工具")
                .title("关于 Medex")
                .show(|_| {});
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}
