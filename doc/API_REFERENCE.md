# Medex 接口文档（API Reference）

更新时间：2026-04-03  
适用仓库：`/Users/terryyoung/Documents/projects/personal/Medex`

---

## 1. 文档范围

本文档覆盖 Medex 当前已实现的：

- Tauri Commands（Rust -> 前端）
- 事件通道（Rust emit -> 前端 listen）
- 前端核心类型
- 典型调用示例与错误约定

---

## 2. 调用方式总览

前端统一使用：

- `invoke('command_name', payload)`
- `listen('event_name', handler)`

导入示例：

```ts
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
```

---

## 3. Rust Command 列表

注册文件：`src-tauri/src/main.rs`

## 3.1 媒体扫描与查询

### `scan_and_index`

定义：

```rust
#[tauri::command]
pub fn scan_and_index(path: String, app_handle: AppHandle) -> Result<(), String>
```

入参：

- `path: string` 目录绝对路径

返回：

- `void`（成功）
- `Err(String)`（失败信息）

副作用：

- 发出 `scan_progress`
- 发出 `scan_done`
- 向 `media` 表写入数据（事务）

---

### `get_all_media`

定义：

```rust
#[tauri::command]
pub fn get_all_media() -> Result<Vec<MediaItem>, String>
```

返回：

- `MediaItem[]` 按 `id DESC`

---

### `filter_media_by_tags`

定义：

```rust
#[tauri::command]
pub fn filter_media_by_tags(tag_names: Vec<String>) -> Result<Vec<MediaItem>, String>
```

说明：

- 兼容接口，内部转调 `filter_media(tag_names, None)`。

---

### `filter_media`

定义：

```rust
#[tauri::command]
pub fn filter_media(tag_names: Vec<String>, media_type: Option<String>) -> Result<Vec<MediaItem>, String>
```

入参：

- `tag_names: string[]`
- `media_type: 'image' | 'video' | null`

行为：

- `tag_names` 为空：按类型过滤或返回全部
- `tag_names` 非空：按标签交集过滤 + 类型过滤

---

### `set_media_favorite`

定义：

```rust
#[tauri::command]
pub fn set_media_favorite(media_id: i64, is_favorite: bool) -> Result<(), String>
```

入参：

- `media_id: number`
- `is_favorite: boolean`

行为：

- 更新 `media.is_favorite`
- 更新 `updated_at`

---

### `mark_media_viewed`

定义：

```rust
#[tauri::command]
pub fn mark_media_viewed(media_id: i64) -> Result<(), String>
```

行为：

- upsert 到 `recent_views`
- 仅保留最近 100 条

---

## 3.2 标签管理

### `get_all_tags`

```rust
#[tauri::command]
pub fn get_all_tags() -> Result<Vec<Tag>, String>
```

返回：

- `Tag[]`（按名称排序）

---

### `get_all_tags_with_count`

```rust
#[tauri::command]
pub fn get_all_tags_with_count() -> Result<Vec<TagWithCount>, String>
```

返回：

- `TagWithCount[]`
- 包含 `mediaCount`

---

### `create_tag`

```rust
#[tauri::command]
pub fn create_tag(tag_name: String) -> Result<(), String>
```

规则：

- `trim` 后空字符串会报错
- `INSERT OR IGNORE`，重复不报错

---

### `delete_tag`

```rust
#[tauri::command]
pub fn delete_tag(tag_id: i64) -> Result<(), String>
```

规则：

- 仅当该标签未被任何媒体引用时可删除
- 若仍被引用，返回错误

---

### `add_tag_to_media`

```rust
#[tauri::command]
pub fn add_tag_to_media(media_id: i64, tag_name: String) -> Result<(), String>
```

流程：

1. `INSERT OR IGNORE tags(name)`
2. 查 `tag_id`
3. `INSERT OR IGNORE media_tags(media_id, tag_id)`

---

### `remove_tag_from_media`

```rust
#[tauri::command]
pub fn remove_tag_from_media(media_id: i64, tag_id: i64) -> Result<(), String>
```

流程：

1. 删除 `media_tags` 关联
2. 若标签已无人引用，则删除 `tags` 中对应记录

---

### `get_tags_by_media`

```rust
#[tauri::command]
pub fn get_tags_by_media(media_id: i64) -> Result<Vec<Tag>, String>
```

返回：

- 指定媒体的标签数组（`id` + `name`）

---

## 3.3 缩略图系统

### `request_thumbnail`

定义：

```rust
#[tauri::command]
pub fn request_thumbnail(path: String) -> Result<String, String>
```

入参：

- `path: string` 视频绝对路径

返回：

- 已缓存：返回实际缩略图路径
- 已入队处理中：返回 `"__PENDING__"`
- 错误：返回字符串错误信息

前端建议：

- 如果返回 `__PENDING__`，等待 `thumbnail_ready` 事件
- 如果返回真实路径，立刻更新 UI

---

## 4. Rust 事件列表

## 4.1 `scan_progress`

结构：

```ts
interface ScanProgressPayload {
  current: number;
  total: number;
  filename: string;
}
```

触发时机：

- `scan_and_index` 每处理一个文件触发一次

---

## 4.2 `scan_done`

结构：

- `boolean`（当前实现固定为 `true`）

触发时机：

- 扫描任务提交完毕后触发一次

---

## 4.3 `thumbnail_ready`

结构：

```ts
interface ThumbnailReadyPayload {
  video_path: string;
  thumbnail_path: string;
}
```

触发时机：

- worker 生成缩略图成功后

---

## 5. 前端核心类型

定义文件：`src/store/useAppStore.ts`

## 5.1 数据类型

```ts
export type MediaItem = {
  id: string;
  path: string;
  thumbnail: string;
  filename: string;
  tags: string[];
  time: string;
  mediaType: string;
  duration: string;
  resolution: string;
  isFavorite: boolean;
  isRecent: boolean;
  recentViewedAt?: number | null;
};
```

```ts
export type DbMediaItem = {
  id: number;
  path: string;
  filename: string;
  type: string;
  isFavorite?: boolean;
  isRecent?: boolean;
  recentViewedAt?: number | null;
  tags?: string[];
};
```

```ts
export type DbTagItem = {
  id: number;
  name: string;
  mediaCount?: number;
};
```

---

## 5.2 命名映射约定

Rust 返回常见序列化字段：

- `type`（媒体类型）
- `isFavorite`
- `isRecent`
- `recentViewedAt`

前端转换后通常映射到：

- `mediaType`
- `isFavorite`
- `isRecent`
- `recentViewedAt`

建议保持“后端 DTO -> 前端 ViewModel”的转换层，不要直接混用。

---

## 6. 调用示例

## 6.1 扫描并刷新

```ts
await invoke('scan_and_index', { path: folderPath });
const rows = await invoke<DbMediaItem[]>('filter_media', {
  tagNames: selectedTags,
  mediaType: mediaType === 'all' ? null : mediaType,
});
```

---

## 6.2 监听扫描进度

```ts
const unlisten = await listen<ScanProgressPayload>('scan_progress', (event) => {
  setProgress(event.payload);
});
```

---

## 6.3 请求视频缩略图

```ts
const result = await invoke<string>('request_thumbnail', { path: videoPath });
if (result && result !== '__PENDING__') {
  // 直接可用
}
```

配套监听：

```ts
const unlisten = await listen<ThumbnailReadyPayload>('thumbnail_ready', (event) => {
  const { video_path, thumbnail_path } = event.payload;
  // 更新缓存映射
});
```

---

## 6.4 标签增删

```ts
await invoke('add_tag_to_media', { mediaId, tagName });
await invoke('remove_tag_from_media', { mediaId, tagId });
```

---

## 7. 错误处理约定

当前约定：

- Rust command 统一 `Result<_, String>`
- 前端 `try/catch` 后打印错误并显示提示

建议后续统一错误码结构：

```ts
interface ApiError {
  code: string;
  message: string;
  detail?: string;
}
```

---

## 8. 并发与性能约定

## 8.1 前端缩略图调度

- `MAX_CONCURRENT = 5`
- `MAX_QUEUE_SIZE = 400`
- 优先级：可见 > 下一屏 > 其余 overscan

## 8.2 后端缩略图调度

- worker 数量：4
- 队列容量：2048
- 同一路径去重：`processing` 集合

---

## 9. 数据库实体定义（参考）

## 9.1 MediaItem（Rust）

`src-tauri/src/services/scanner.rs` 中定义：

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaItem {
    pub id: i64,
    pub path: String,
    pub filename: String,
    #[serde(rename = "type")]
    pub media_type: String,
    #[serde(rename = "isFavorite")]
    pub is_favorite: bool,
    #[serde(rename = "isRecent")]
    pub is_recent: bool,
    #[serde(rename = "recentViewedAt")]
    pub recent_viewed_at: Option<i64>,
    pub tags: Vec<String>,
}
```

## 9.2 Tag（Rust）

`src-tauri/src/services/tags.rs`：

```rust
#[derive(Debug, Clone, Serialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
}
```

---

## 10. 推荐的 API 演进方向

1. 新增 `remove_media(media_id)`，实现媒体删除全链路。
2. 新增分页接口（`limit/offset`）支持超大库快速首屏。
3. 新增批量标签接口（减少大量 invoke 往返）。
4. 统一事件协议（增加 taskId、status、error 字段）。
5. 增加版本化 API 命名（`v1/*`）便于后向兼容。

---

## 11. 文件索引

- Command 注册：`src-tauri/src/main.rs`
- 扫描/筛选：`src-tauri/src/services/scanner.rs`
- 标签：`src-tauri/src/services/tags.rs`
- 缩略图：`src-tauri/src/thumbnail/*`
- 前端调用入口：
  - `src/containers/ToolbarContainer.tsx`
  - `src/containers/MediaGridContainer.tsx`
  - `src/containers/SidebarContainer.tsx`
  - `src/components/MediaCard.tsx`

