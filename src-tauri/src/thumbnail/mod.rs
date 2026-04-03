pub mod manager;
pub mod queue;
pub mod utils;
pub mod worker;

use std::path::PathBuf;

use anyhow::Result;
use once_cell::sync::OnceCell;
use serde::Serialize;

use manager::ThumbnailManager;

pub const THUMBNAIL_WORKER_COUNT: usize = 4;
pub const THUMBNAIL_QUEUE_CAPACITY: usize = 2048;
pub const THUMBNAIL_PLACEHOLDER: &str = "__PENDING__";

#[derive(Clone, Debug)]
pub struct ThumbnailTask {
    pub video_path: String,
    pub output_path: PathBuf,
}

#[derive(Debug, Clone, Serialize)]
pub struct ThumbnailReady {
    pub video_path: String,
    pub thumbnail_path: String,
}

static THUMBNAIL_MANAGER: OnceCell<ThumbnailManager> = OnceCell::new();

pub fn init(app_handle: &tauri::AppHandle) -> Result<()> {
    if THUMBNAIL_MANAGER.get().is_some() {
        return Ok(());
    }

    let manager = ThumbnailManager::new(
        app_handle,
        THUMBNAIL_WORKER_COUNT,
        THUMBNAIL_QUEUE_CAPACITY,
    )?;

    THUMBNAIL_MANAGER
        .set(manager)
        .map_err(|_| anyhow::anyhow!("thumbnail manager is already initialized"))?;

    println!("[thumbnail] manager initialized");
    Ok(())
}

fn get_manager() -> Result<&'static ThumbnailManager> {
    THUMBNAIL_MANAGER
        .get()
        .ok_or_else(|| anyhow::anyhow!("thumbnail manager is not initialized"))
}

#[tauri::command]
pub fn request_thumbnail(path: String) -> Result<String, String> {
    let manager = get_manager().map_err(|err| err.to_string())?;
    manager.request_thumbnail(&path).map_err(|err| err.to_string())
}
