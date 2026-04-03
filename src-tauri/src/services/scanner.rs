use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{anyhow, Context, Result};
use rusqlite::{params, Connection};
use serde::Serialize;
use walkdir::WalkDir;

#[derive(Debug, Clone)]
pub struct MediaFile {
    pub path: String,
    pub filename: String,
    pub media_type: String,
}

pub fn is_media_file(path: &Path) -> bool {
    media_type_from_path(path).is_some()
}

pub fn scan_directory(dir: &str) -> Result<Vec<MediaFile>> {
    let root = Path::new(dir);
    if !root.exists() {
        return Err(anyhow!("directory does not exist: {dir}"));
    }
    if !root.is_dir() {
        return Err(anyhow!("path is not a directory: {dir}"));
    }

    println!("[scanner] start scanning directory: {dir}");

    let mut files = Vec::new();
    for entry in WalkDir::new(root).follow_links(false) {
        let entry = match entry {
            Ok(v) => v,
            Err(err) => {
                eprintln!("[scanner] skip entry (walk error): {err}");
                continue;
            }
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let media_type = match media_type_from_path(path) {
            Some(v) => v,
            None => continue,
        };

        let filename = match path.file_name().and_then(|v| v.to_str()) {
            Some(v) if !v.is_empty() => v.to_string(),
            _ => continue,
        };

        let full_path = match path.canonicalize() {
            Ok(v) => v.to_string_lossy().into_owned(),
            Err(_) => path.to_string_lossy().into_owned(),
        };

        files.push(MediaFile {
            path: full_path,
            filename,
            media_type: media_type.to_string(),
        });
    }

    println!("[scanner] scanned media files: {}", files.len());
    Ok(files)
}

pub fn insert_media_batch(conn: &mut Connection, files: Vec<MediaFile>) -> Result<()> {
    let now = current_timestamp_secs()?;
    let total = files.len();
    let mut inserted = 0usize;

    let tx = conn
        .transaction()
        .context("failed to start transaction for media insertion")?;
    {
        let mut stmt = tx
            .prepare(
                "INSERT OR IGNORE INTO media (path, filename, type, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?);",
            )
            .context("failed to prepare media insert statement")?;

        for file in files {
            let affected = stmt
                .execute(params![
                    file.path,
                    file.filename,
                    file.media_type,
                    now,
                    now
                ])
                .context("failed to insert media row")?;
            inserted += affected;
        }
    }
    tx.commit()
        .context("failed to commit media insertion transaction")?;

    println!("[scanner] insert completed: attempted={total}, inserted={inserted}");
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
pub struct MediaItem {
    pub id: i64,
    pub path: String,
    pub filename: String,
    #[serde(rename = "type")]
    pub media_type: String,
}

#[tauri::command]
pub fn scan_and_index(path: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    println!("[scanner] scan_and_index called, path={path}");

    crate::db::init_db(&app_handle).map_err(|e| e.to_string())?;
    let files = scan_directory(&path).map_err(|e| e.to_string())?;
    let scanned_count = files.len();

    crate::db::with_connection(|conn| insert_media_batch(conn, files)).map_err(|e| e.to_string())?;

    Ok(format!("扫描完成，共导入 {} 个文件", scanned_count))
}

#[tauri::command]
pub fn get_all_media() -> Result<Vec<MediaItem>, String> {
    crate::db::with_connection(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, path, filename, type FROM media ORDER BY id DESC;")
            .context("failed to prepare media query")?;

        let rows = stmt
            .query_map([], |row| {
                Ok(MediaItem {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    filename: row.get(2)?,
                    media_type: row.get(3)?,
                })
            })
            .context("failed to execute media query")?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row.context("failed to parse media row")?);
        }
        Ok(items)
    })
    .map_err(|err| err.to_string())
}

fn media_type_from_path(path: &Path) -> Option<&'static str> {
    let ext = path
        .extension()
        .and_then(|v| v.to_str())
        .map(|v| v.to_ascii_lowercase())?;

    match ext.as_str() {
        "jpg" | "jpeg" | "png" | "webp" | "gif" => Some("image"),
        "mp4" | "mov" | "mkv" | "webm" => Some("video"),
        _ => None,
    }
}

fn current_timestamp_secs() -> Result<i64> {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system clock is before unix epoch")?
        .as_secs();
    i64::try_from(secs).context("timestamp overflow converting to i64")
}
