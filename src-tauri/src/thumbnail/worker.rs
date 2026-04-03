use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
    thread,
};

use tauri::Emitter;

use crate::thumbnail::{
    queue::ThumbnailReceiver, utils::generate_thumbnail, ThumbnailReady, ThumbnailTask,
};

pub fn spawn_workers(
    worker_count: usize,
    receiver: ThumbnailReceiver,
    processing: Arc<Mutex<HashSet<String>>>,
    app_handle: tauri::AppHandle,
    ffmpeg_bin: Option<String>,
) {
    for worker_id in 0..worker_count {
        let receiver = Arc::clone(&receiver);
        let processing = Arc::clone(&processing);
        let app_handle = app_handle.clone();
        let ffmpeg_bin = ffmpeg_bin.clone();

        let spawn_result = thread::Builder::new()
            .name(format!("thumbnail-worker-{worker_id}"))
            .spawn(move || {
                loop {
                    let task = {
                        let lock = receiver.lock();
                        let Ok(rx) = lock else {
                            eprintln!("[thumbnail] worker lock receiver failed");
                            break;
                        };
                        match rx.recv() {
                            Ok(task) => task,
                            Err(_) => break,
                        }
                    };

                    handle_task(task, &processing, &app_handle, ffmpeg_bin.as_deref());
                }
            });

        if let Err(err) = spawn_result {
            eprintln!("[thumbnail] failed to spawn worker {worker_id}: {err}");
        }
    }
}

fn handle_task(
    task: ThumbnailTask,
    processing: &Arc<Mutex<HashSet<String>>>,
    app_handle: &tauri::AppHandle,
    ffmpeg_bin: Option<&str>,
) {
    if task.output_path.exists() {
        emit_ready(app_handle, &task);
        remove_processing(processing, &task.video_path);
        return;
    }

    let Some(ffmpeg_bin) = ffmpeg_bin else {
        eprintln!(
            "[thumbnail] ffmpeg unavailable, skip thumbnail generation: {}",
            task.video_path
        );
        remove_processing(processing, &task.video_path);
        return;
    };

    match generate_thumbnail(&task, ffmpeg_bin) {
        Ok(()) => emit_ready(app_handle, &task),
        Err(err) => eprintln!("[thumbnail] generate failed for {}: {err:#}", task.video_path),
    }

    remove_processing(processing, &task.video_path);
}

fn emit_ready(app_handle: &tauri::AppHandle, task: &ThumbnailTask) {
    let payload = ThumbnailReady {
        video_path: task.video_path.clone(),
        thumbnail_path: task.output_path.to_string_lossy().to_string(),
    };
    if let Err(err) = app_handle.emit("thumbnail_ready", payload) {
        eprintln!("[thumbnail] emit thumbnail_ready failed: {err}");
    }
}

fn remove_processing(processing: &Arc<Mutex<HashSet<String>>>, video_path: &str) {
    if let Ok(mut lock) = processing.lock() {
        lock.remove(video_path);
    }
}
