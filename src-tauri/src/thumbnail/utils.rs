use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    path::{Path, PathBuf},
    process::Command,
};

use anyhow::{anyhow, Context, Result};
use tauri::Manager;

use crate::thumbnail::ThumbnailTask;

pub fn hash_path(path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

pub fn thumbnail_cache_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .context("failed to resolve app_data_dir for thumbnails")?;
    let dir = data_dir.join("thumbnails");
    std::fs::create_dir_all(&dir)
        .with_context(|| format!("failed to create thumbnail cache dir {}", dir.display()))?;
    Ok(dir)
}

pub fn output_path_for_video(cache_dir: &Path, video_path: &str) -> PathBuf {
    let file_name = format!("{}.jpg", hash_path(video_path));
    cache_dir.join(file_name)
}

pub fn generate_thumbnail(task: &ThumbnailTask, ffmpeg_bin: &str) -> Result<()> {
    let output = Command::new(ffmpeg_bin)
        .args([
            "-ss",
            "1",
            "-i",
            &task.video_path,
            "-frames:v",
            "1",
            "-vf",
            "scale=320:-1",
            "-y",
            task.output_path
                .to_str()
                .ok_or_else(|| anyhow!("invalid output path"))?,
        ])
        .output()
        .context("failed to start ffmpeg process")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("ffmpeg failed for {}: {}", task.video_path, stderr));
    }

    Ok(())
}

pub fn is_video_file(path: &str) -> bool {
    Path::new(path)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| matches!(ext.to_lowercase().as_str(), "mp4" | "mov" | "mkv" | "webm"))
        .unwrap_or(false)
}

pub fn resolve_ffmpeg_bin(app_handle: &tauri::AppHandle) -> Option<String> {
    // 1) Prefer bundled ffmpeg from Tauri resources.
    if let Some(path) = find_ffmpeg_in_resources(app_handle) {
        return Some(path);
    }

    // 2) Dev fallback: local binaries directory.
    if let Some(path) = find_ffmpeg_in_dev_binaries() {
        return Some(path);
    }

    // 3) Fallback to system PATH.
    if let Some(path) = find_ffmpeg_in_path() {
        return Some(path);
    }

    // 4) Common macOS Homebrew paths.
    let common_paths = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"];
    for path in common_paths {
        if Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    None
}

fn find_ffmpeg_in_path() -> Option<String> {
    let path_var = std::env::var("PATH").ok()?;
    for dir in std::env::split_paths(&path_var) {
        let bin = dir.join("ffmpeg");
        if bin.exists() {
            return Some(bin.to_string_lossy().to_string());
        }
    }
    None
}

fn find_ffmpeg_in_resources(app_handle: &tauri::AppHandle) -> Option<String> {
    let resource_dir = app_handle.path().resource_dir().ok()?;
    find_ffmpeg_in_dir(&resource_dir)
}

fn find_ffmpeg_in_dev_binaries() -> Option<String> {
    // Typical dev cwd for Tauri process is src-tauri.
    let cwd = std::env::current_dir().ok()?;
    let candidates = [cwd.join("binaries"), cwd.join("../src-tauri/binaries")];

    for dir in candidates {
        if let Some(path) = find_ffmpeg_in_dir(&dir) {
            return Some(path);
        }
    }
    None
}

fn find_ffmpeg_in_dir(dir: &Path) -> Option<String> {
    if !dir.exists() {
        return None;
    }

    let direct_names = ["ffmpeg", "ffmpeg.exe"];
    for name in direct_names {
        let candidate = dir.join(name);
        if candidate.exists() && candidate.is_file() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }

    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let file_name = path.file_name()?.to_string_lossy().to_lowercase();
        if file_name == "ffmpeg"
            || file_name == "ffmpeg.exe"
            || file_name.starts_with("ffmpeg-")
            || file_name.starts_with("ffmpeg_")
        {
            return Some(path.to_string_lossy().to_string());
        }
    }

    None
}
