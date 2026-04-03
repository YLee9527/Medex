use std::{
    collections::HashSet,
    path::PathBuf,
    sync::{mpsc::TrySendError, Arc, Mutex},
};

use anyhow::{Context, Result};

use crate::thumbnail::{
    queue::{create_queue, ThumbnailSender},
    utils::{is_video_file, output_path_for_video, resolve_ffmpeg_bin, thumbnail_cache_dir},
    worker::spawn_workers,
    ThumbnailTask, THUMBNAIL_PLACEHOLDER,
};

pub struct ThumbnailManager {
    queue: ThumbnailSender,
    pub cache_dir: PathBuf,
    pub processing: Arc<Mutex<HashSet<String>>>,
    pub ffmpeg_bin: Option<String>,
}

impl ThumbnailManager {
    pub fn new(app_handle: &tauri::AppHandle, worker_count: usize, queue_capacity: usize) -> Result<Self> {
        let cache_dir = thumbnail_cache_dir(app_handle)?;
        let ffmpeg_bin = resolve_ffmpeg_bin(app_handle);
        if let Some(bin) = &ffmpeg_bin {
            println!("[thumbnail] ffmpeg found: {bin}");
        } else {
            eprintln!("[thumbnail] ffmpeg not found, video thumbnail generation is disabled");
        }
        let processing = Arc::new(Mutex::new(HashSet::new()));
        let (sender, receiver) = create_queue(queue_capacity);

        spawn_workers(
            worker_count,
            receiver,
            Arc::clone(&processing),
            app_handle.clone(),
            ffmpeg_bin.clone(),
        );

        Ok(Self {
            queue: sender,
            cache_dir,
            processing,
            ffmpeg_bin,
        })
    }

    pub fn request_thumbnail(&self, video_path: &str) -> Result<String> {
        if !is_video_file(video_path) {
            return Err(anyhow::anyhow!("not a supported video file: {video_path}"));
        }
        if self.ffmpeg_bin.is_none() {
            return Err(anyhow::anyhow!(
                "ffmpeg not found. Please install ffmpeg or bundle ffmpeg binary with the app."
            ));
        }

        let output_path = output_path_for_video(&self.cache_dir, video_path);
        if output_path.exists() {
            return Ok(output_path.to_string_lossy().to_string());
        }

        let mut processing = self
            .processing
            .lock()
            .map_err(|err| anyhow::anyhow!("thumbnail processing set lock failed: {err}"))?;

        if processing.contains(video_path) {
            return Ok(THUMBNAIL_PLACEHOLDER.to_string());
        }

        processing.insert(video_path.to_string());
        drop(processing);

        let task = ThumbnailTask {
            video_path: video_path.to_string(),
            output_path: output_path.clone(),
        };

        match self.queue.try_send(task) {
            Ok(()) => {}
            Err(TrySendError::Full(task)) => {
                if let Ok(mut processing) = self.processing.lock() {
                    processing.remove(video_path);
                }
                eprintln!(
                    "[thumbnail] queue is full, skip enqueue for now: {} -> {}",
                    task.video_path,
                    task.output_path.display()
                );
                return Ok(THUMBNAIL_PLACEHOLDER.to_string());
            }
            Err(TrySendError::Disconnected(_task)) => {
                if let Ok(mut processing) = self.processing.lock() {
                    processing.remove(video_path);
                }
                return Err(anyhow::anyhow!("thumbnail queue disconnected"))
                    .context("queue send error");
            }
        }

        Ok(THUMBNAIL_PLACEHOLDER.to_string())
    }
}
