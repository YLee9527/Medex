use anyhow::{anyhow, Context, Result};
use rusqlite::{params, OptionalExtension};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TagWithCount {
    pub id: i64,
    pub name: String,
    #[serde(rename = "mediaCount")]
    pub media_count: i64,
}

#[tauri::command]
pub fn get_all_tags() -> Result<Vec<Tag>, String> {
    crate::db::with_connection(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, name FROM tags ORDER BY name ASC;")
            .context("failed to prepare get_all_tags query")?;

        let rows = stmt
            .query_map([], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .context("failed to execute get_all_tags query")?;

        let mut tags = Vec::new();
        for row in rows {
            tags.push(row.context("failed to parse tag row")?);
        }
        Ok(tags)
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_all_tags_with_count() -> Result<Vec<TagWithCount>, String> {
    crate::db::with_connection(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.name, COUNT(mt.media_id) AS media_count
                 FROM tags t
                 LEFT JOIN media_tags mt ON mt.tag_id = t.id
                 GROUP BY t.id, t.name
                 ORDER BY t.name ASC;",
            )
            .context("failed to prepare get_all_tags_with_count query")?;

        let rows = stmt
            .query_map([], |row| {
                Ok(TagWithCount {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    media_count: row.get(2)?,
                })
            })
            .context("failed to execute get_all_tags_with_count query")?;

        let mut tags = Vec::new();
        for row in rows {
            tags.push(row.context("failed to parse tag_with_count row")?);
        }
        Ok(tags)
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn create_tag(tag_name: String) -> Result<(), String> {
    crate::db::with_connection(|conn| {
        let normalized = tag_name.trim();
        if normalized.is_empty() {
            return Err(anyhow!("tag_name cannot be empty"));
        }

        conn.execute(
            "INSERT OR IGNORE INTO tags (name) VALUES (?);",
            params![normalized],
        )
        .context("failed to insert tag")?;

        Ok(())
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn delete_tag(tag_id: i64) -> Result<(), String> {
    crate::db::with_connection(|conn| {
        let tx = conn
            .transaction()
            .context("failed to start transaction for delete_tag")?;

        let used: Option<i64> = tx
            .query_row(
                "SELECT 1 FROM media_tags WHERE tag_id = ? LIMIT 1;",
                params![tag_id],
                |row| row.get(0),
            )
            .optional()
            .context("failed to check tag usage before delete")?;

        if used.is_some() {
            return Err(anyhow!("tag is still used by media and cannot be deleted"));
        }

        tx.execute("DELETE FROM tags WHERE id = ?;", params![tag_id])
            .context("failed to delete tag")?;

        tx.commit()
            .context("failed to commit transaction for delete_tag")?;

        Ok(())
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn add_tag_to_media(media_id: i64, tag_name: String) -> Result<(), String> {
    crate::db::with_connection(|conn| {
        let normalized = tag_name.trim();
        if normalized.is_empty() {
            return Err(anyhow!("tag_name cannot be empty"));
        }

        let tx = conn
            .transaction()
            .context("failed to start transaction for add_tag_to_media")?;

        tx.execute(
            "INSERT OR IGNORE INTO tags (name) VALUES (?);",
            params![normalized],
        )
        .context("failed to insert tag")?;

        let tag_id: i64 = tx
            .query_row(
                "SELECT id FROM tags WHERE name = ?;",
                params![normalized],
                |row| row.get(0),
            )
            .context("failed to fetch tag id")?;

        tx.execute(
            "INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?);",
            params![media_id, tag_id],
        )
        .context("failed to insert media_tags relation")?;

        tx.commit()
            .context("failed to commit transaction for add_tag_to_media")?;

        Ok(())
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn remove_tag_from_media(media_id: i64, tag_id: i64) -> Result<(), String> {
    crate::db::with_connection(|conn| {
        let tx = conn
            .transaction()
            .context("failed to start transaction for remove_tag_from_media")?;

        tx.execute(
            "DELETE FROM media_tags WHERE media_id = ? AND tag_id = ?;",
            params![media_id, tag_id],
        )
        .context("failed to delete media_tags relation")?;

        let is_tag_used_elsewhere: Option<i64> = tx
            .query_row(
                "SELECT 1 FROM media_tags WHERE tag_id = ? LIMIT 1;",
                params![tag_id],
                |row| row.get(0),
            )
            .optional()
            .context("failed to check remaining tag usages")?;

        if is_tag_used_elsewhere.is_none() {
            tx.execute("DELETE FROM tags WHERE id = ?;", params![tag_id])
                .context("failed to cleanup unused tag")?;
        }

        tx.commit()
            .context("failed to commit transaction for remove_tag_from_media")?;

        Ok(())
    })
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_tags_by_media(media_id: i64) -> Result<Vec<Tag>, String> {
    crate::db::with_connection(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.name
                 FROM tags t
                 JOIN media_tags mt ON t.id = mt.tag_id
                 WHERE mt.media_id = ?
                 ORDER BY t.name ASC;",
            )
            .context("failed to prepare get_tags_by_media query")?;

        let rows = stmt
            .query_map(params![media_id], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .context("failed to execute get_tags_by_media query")?;

        let mut tags = Vec::new();
        for row in rows {
            tags.push(row.context("failed to parse tag row")?);
        }
        Ok(tags)
    })
    .map_err(|err| err.to_string())
}
