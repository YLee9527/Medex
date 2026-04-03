use std::sync::{mpsc, mpsc::Receiver, mpsc::SyncSender, Arc, Mutex};

use crate::thumbnail::ThumbnailTask;

pub type ThumbnailSender = SyncSender<ThumbnailTask>;
pub type ThumbnailReceiver = Arc<Mutex<Receiver<ThumbnailTask>>>;

pub fn create_queue(capacity: usize) -> (ThumbnailSender, ThumbnailReceiver) {
    let (sender, receiver) = mpsc::sync_channel::<ThumbnailTask>(capacity);
    (sender, Arc::new(Mutex::new(receiver)))
}
