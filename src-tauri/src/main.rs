#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod services;
mod thumbnail;
mod menu;

use tauri::menu::{MenuItem, Submenu, Menu};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if let Err(err) = db::init_db(app.handle()) {
                eprintln!("failed to initialize database: {err:#}");
                return Err(Box::<dyn std::error::Error>::from(err));
            }
            if let Err(err) = thumbnail::init(app.handle()) {
                eprintln!("failed to initialize thumbnail system: {err:#}");
                return Err(Box::<dyn std::error::Error>::from(err));
            }
            
            // 创建并设置菜单
            let about_item = MenuItem::with_id(app.handle(), "about", "About Medex", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app.handle(), "settings", "设置", true, None::<&str>)?;
            let check_update_item = MenuItem::with_id(app.handle(), "check_update", "检查更新", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app.handle(), "quit", "Quit", true, None::<&str>)?;

            let submenu = Submenu::with_items(app.handle(), "Medex", true, &[
                &about_item,
                &settings_item,
                &check_update_item,
                &tauri::menu::PredefinedMenuItem::separator(app.handle())?,
                &quit_item,
            ])?;

            let menu = Menu::with_items(app.handle(), &[&submenu])?;
            app.set_menu(menu)?;
            
            // 监听菜单事件
            let app_handle = app.handle().clone();
            app.on_menu_event(move |app, event| {
                menu::handle_menu_event(app_handle.clone(), event);
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            services::scanner::scan_and_index,
            services::scanner::get_all_media,
            services::scanner::filter_media_by_tags,
            services::scanner::filter_media,
            services::scanner::set_media_favorite,
            services::scanner::mark_media_viewed,
            services::tags::get_all_tags,
            services::tags::get_all_tags_with_count,
            services::tags::create_tag,
            services::tags::delete_tag,
            services::tags::add_tag_to_media,
            services::tags::remove_tag_from_media,
            services::tags::get_tags_by_media,
            thumbnail::request_thumbnail
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
