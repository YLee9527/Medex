#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod services;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Err(err) = db::init_db(app.handle()) {
                eprintln!("failed to initialize database: {err:#}");
                return Err(Box::<dyn std::error::Error>::from(err));
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![services::scanner::scan_and_index])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
