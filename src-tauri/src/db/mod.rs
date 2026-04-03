use std::{fs, path::PathBuf, sync::Mutex};

use anyhow::{anyhow, Context, Result};
use once_cell::sync::OnceCell;
use rusqlite::Connection;
use tauri::Manager;

static DB_CONN: OnceCell<Mutex<Connection>> = OnceCell::new();

const DB_FILE_NAME: &str = "medex.db";

const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE,
    filename TEXT,
    type TEXT,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS media_tags (
    media_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (media_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_media_path ON media(path);
CREATE INDEX IF NOT EXISTS idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag_id ON media_tags(tag_id);
"#;

pub fn init_db(app_handle: &tauri::AppHandle) -> Result<()> {
    if DB_CONN.get().is_some() {
        return Ok(());
    }

    let db_path = resolve_db_path(app_handle)?;
    let conn = Connection::open(&db_path)
        .with_context(|| format!("failed to open sqlite database at {}", db_path.display()))?;

    conn.execute_batch(INIT_SQL)
        .context("failed to create tables/indexes for medex database")?;

    DB_CONN
        .set(Mutex::new(conn))
        .map_err(|_| anyhow!("database connection has already been initialized"))?;

    println!("SQLite initialized: {}", db_path.display());
    Ok(())
}

pub fn with_connection<T, F>(f: F) -> Result<T>
where
    F: FnOnce(&mut Connection) -> Result<T>,
{
    let conn = DB_CONN
        .get()
        .ok_or_else(|| anyhow!("database is not initialized"))?;

    let mut guard = conn
        .lock()
        .map_err(|err| anyhow!("failed to lock sqlite connection: {err}"))?;

    f(&mut guard)
}

fn resolve_db_path(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .context("failed to resolve tauri app_data_dir")?;

    fs::create_dir_all(&data_dir)
        .with_context(|| format!("failed to create app data directory at {}", data_dir.display()))?;

    Ok(data_dir.join(DB_FILE_NAME))
}
