use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use rusqlite::{params, params_from_iter, types::Value, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFile {
    pub path: String,
    pub filename: String,
    pub media_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaItem {
    pub id: i64,
    pub path: String,
    pub filename: String,
    #[serde(rename = "type")]
    pub media_type: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
struct ScanProgress {
    current: usize,
    total: usize,
    filename: String,
}

pub fn is_media_file(path: &Path) -> bool {
    media_type_from_path(path).is_some()
}

fn media_type_from_path(path: &Path) -> Option<&'static str> {
    let ext = path.extension()?.to_str()?.to_lowercase();

    match ext.as_str() {
        "jpg" | "jpeg" | "png" | "webp" | "gif" => Some("image"),
        "mp4" | "mov" | "mkv" | "webm" => Some("video"),
        _ => None,
    }
}

pub fn scan_directory(dir: &str) -> Result<Vec<MediaFile>> {
    let mut files = Vec::new();

    for entry in WalkDir::new(dir).follow_links(false) {
        let entry = match entry {
            Ok(entry) => entry,
            Err(err) => {
                eprintln!("[scanner] skip entry because of walkdir error: {err}");
                continue;
            }
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if !is_media_file(path) {
            continue;
        }

        let Some(media_type) = media_type_from_path(path) else {
            continue;
        };

        let filename = entry.file_name().to_string_lossy().to_string();
        files.push(MediaFile {
            path: path.to_string_lossy().to_string(),
            filename,
            media_type: media_type.to_string(),
        });
    }

    Ok(files)
}

pub fn insert_media_batch(conn: &mut Connection, files: Vec<MediaFile>) -> Result<()> {
    let now = current_timestamp_seconds();

    let tx = conn
        .transaction()
        .context("failed to start transaction for insert_media_batch")?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT OR IGNORE INTO media (path, filename, type, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?);",
            )
            .context("failed to prepare insert_media_batch statement")?;

        for file in files {
            stmt.execute(params![file.path, file.filename, file.media_type, now, now])
                .context("failed to execute insert_media_batch statement")?;
        }
    }

    tx.commit()
        .context("failed to commit transaction for insert_media_batch")?;

    Ok(())
}

fn get_all_media_inner(conn: &Connection) -> Result<Vec<MediaItem>> {
    let mut stmt = conn
        .prepare(
            "SELECT
                m.id,
                m.path,
                m.filename,
                m.type,
                COALESCE(GROUP_CONCAT(t.name, '||'), '') AS tags_concat
             FROM media m
             LEFT JOIN media_tags mt ON mt.media_id = m.id
             LEFT JOIN tags t ON t.id = mt.tag_id
             GROUP BY m.id
             ORDER BY m.id DESC;",
        )
        .context("failed to prepare get_all_media query")?;

    let rows = stmt
        .query_map([], |row| {
            Ok(MediaItem {
                id: row.get(0)?,
                path: row.get(1)?,
                filename: row.get(2)?,
                media_type: row.get(3)?,
                tags: parse_tags(row.get::<_, String>(4)?),
            })
        })
        .context("failed to execute get_all_media query")?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.context("failed to parse media row")?);
    }

    Ok(items)
}

#[tauri::command]
pub fn get_all_media() -> Result<Vec<MediaItem>, String> {
    crate::db::with_connection(|conn| get_all_media_inner(conn)).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn filter_media_by_tags(tag_names: Vec<String>) -> Result<Vec<MediaItem>, String> {
    crate::db::with_connection(|conn| {
        if tag_names.is_empty() {
            return get_all_media_inner(conn);
        }

        let placeholders = vec!["?"; tag_names.len()].join(",");
        let sql = format!(
            "SELECT
                m.id,
                m.path,
                m.filename,
                m.type,
                COALESCE(GROUP_CONCAT(t2.name, '||'), '') AS tags_concat
             FROM media m
             JOIN (
                SELECT m1.id
                FROM media m1
                JOIN media_tags mt1 ON m1.id = mt1.media_id
                JOIN tags t1 ON t1.id = mt1.tag_id
                WHERE t1.name IN ({})
                GROUP BY m1.id
                HAVING COUNT(DISTINCT t1.id) = ?
             ) matched ON matched.id = m.id
             LEFT JOIN media_tags mt2 ON mt2.media_id = m.id
             LEFT JOIN tags t2 ON t2.id = mt2.tag_id
             GROUP BY m.id
             ORDER BY m.id DESC;",
            placeholders
        );

        let mut values: Vec<Value> = tag_names.into_iter().map(Value::Text).collect();
        values.push(Value::Integer(values.len() as i64));

        let mut stmt = conn
            .prepare(&sql)
            .context("failed to prepare filter_media_by_tags query")?;

        let rows = stmt
            .query_map(params_from_iter(values), |row| {
                Ok(MediaItem {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    filename: row.get(2)?,
                    media_type: row.get(3)?,
                    tags: parse_tags(row.get::<_, String>(4)?),
                })
            })
            .context("failed to execute filter_media_by_tags query")?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row.context("failed to parse filtered media row")?);
        }

        Ok(items)
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn scan_and_index(path: String, app_handle: AppHandle) -> Result<(), String> {
    println!("[scanner] start scanning path: {path}");

    let files = scan_directory(&path).map_err(|err| err.to_string())?;
    let total = files.len();

    println!("[scanner] media files detected: {total}");

    crate::db::with_connection(|conn| {
        let now = current_timestamp_seconds();
        let tx = conn
            .transaction()
            .context("failed to start transaction for scan_and_index")?;

        let mut inserted = 0usize;

        {
            let mut stmt = tx
                .prepare(
                    "INSERT OR IGNORE INTO media (path, filename, type, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?);",
                )
                .context("failed to prepare scan insert statement")?;

            for (index, file) in files.iter().enumerate() {
                let changed = stmt
                    .execute(params![file.path, file.filename, file.media_type, now, now])
                    .context("failed to execute scan insert statement")?;

                inserted += changed;

                app_handle
                    .emit(
                        "scan_progress",
                        ScanProgress {
                            current: index + 1,
                            total,
                            filename: file.filename.clone(),
                        },
                    )
                    .context("failed to emit scan_progress event")?;
            }
        }

        tx.commit()
            .context("failed to commit scan_and_index transaction")?;

        println!("[scanner] inserted rows: {inserted}");
        Ok(())
    })
    .map_err(|err| err.to_string())?;

    app_handle
        .emit("scan_done", true)
        .map_err(|err| err.to_string())?;

    println!("[scanner] done");

    Ok(())
}

fn current_timestamp_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or_default()
}

fn parse_tags(tags_concat: String) -> Vec<String> {
    if tags_concat.trim().is_empty() {
        return Vec::new();
    }
    tags_concat
        .split("||")
        .map(str::trim)
        .filter(|tag| !tag.is_empty())
        .map(ToString::to_string)
        .collect()
}
