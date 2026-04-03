# Medex 开发文档（详细版）

更新时间：2026-04-03  
适用代码库：`/Users/terryyoung/Documents/projects/personal/Medex`

---

## 1. 项目概览

Medex 是一个基于 **React + TypeScript + Tauri v2 + Rust + SQLite** 的桌面媒体管理软件，核心目标是：

- 扫描本地目录并建立媒体索引（图片/视频）
- 支持标签体系（新增、删除、绑定媒体、筛选）
- 支持收藏/最近查看等状态持久化
- 支持大规模媒体列表展示（虚拟列表 + 缩略图懒加载）
- 支持双击全屏 Viewer 进行图片查看与视频播放

当前实现以「高性能列表浏览 + 标签组织能力 + 本地数据持久化」为主。

---

## 2. 技术栈与版本

### 2.1 前端

- React 18
- TypeScript 5
- Vite 5
- TailwindCSS 3
- Zustand（全局状态管理）
- react-window（虚拟列表/网格）
- react-dnd（标签拖拽到卡片）
- Tauri JS API（invoke、event、dialog）

### 2.2 后端

- Tauri v2
- Rust 2021
- rusqlite（SQLite，`bundled`）
- walkdir（目录递归扫描）
- once_cell（全局单例）
- anyhow（错误处理）

### 2.3 外部运行时依赖

- ffmpeg（用于视频首帧缩略图生成）
  - 当前策略：**优先内置二进制**，找不到再回退系统 PATH

---

## 3. 项目结构（实际代码树）

> 已过滤 `node_modules`、`target`、`dist` 等构建目录。

```text
Medex/
├── DEVELOPMENT.md
├── LICENSE
├── PRODUCT.md
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Main.tsx
│   │   ├── Toolbar.tsx
│   │   ├── MediaGrid.tsx
│   │   ├── MediaCard.tsx
│   │   ├── MediaViewer.tsx
│   │   ├── Inspector.tsx
│   │   ├── TagItem.tsx
│   │   └── TagDragOverlay.tsx
│   ├── containers/
│   │   ├── SidebarContainer.tsx
│   │   ├── ToolbarContainer.tsx
│   │   ├── MediaGridContainer.tsx
│   │   └── InspectorContainer.tsx
│   └── store/
│       ├── useAppStore.ts
│       └── useTagDragStore.ts
└── src-tauri/
    ├── Cargo.toml
    ├── Cargo.lock
    ├── build.rs
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json
    ├── icons/
    │   ├── icon.png
    │   ├── 32x32.png
    │   ├── 128x128.png
    │   └── 128x128@2x.png
    └── src/
        ├── main.rs
        ├── db/
        │   └── mod.rs
        ├── services/
        │   ├── mod.rs
        │   ├── scanner.rs
        │   └── tags.rs
        └── thumbnail/
            ├── mod.rs
            ├── manager.rs
            ├── queue.rs
            ├── worker.rs
            └── utils.rs
```

---

## 4. 架构说明

## 4.1 前后端通信

主要通过 Tauri `invoke` + `event`：

- `invoke`：前端调用 Rust command（同步请求/响应）
- `event`：后端推送扫描进度与缩略图完成事件

关键事件：

- `scan_progress`：扫描进度（current / total / filename）
- `scan_done`：扫描结束信号
- `thumbnail_ready`：视频缩略图生成完成（video_path / thumbnail_path）

前端内部还使用 `window.dispatchEvent` 做轻量刷新信号：

- `medex:media-updated`
- `medex:tags-updated`
- `medex:media-tags-updated`

## 4.2 状态分层

- **全局业务状态**：`useAppStore`（媒体列表、筛选状态、标签状态、导航状态等）
- **拖拽临时状态**：`useTagDragStore`
- **组件局部状态**：输入框、loading、队列等

## 4.3 数据持久化边界

持久化在 SQLite 中完成：

- 媒体主数据：`media`
- 标签字典：`tags`
- 媒体-标签关系：`media_tags`
- 最近查看记录：`recent_views`
- 收藏状态：`media.is_favorite`

---

## 5. SQLite 设计与初始化

实现位置：`src-tauri/src/db/mod.rs`

## 5.1 数据库路径

通过 Tauri 提供路径 API 获取：

- `app_handle.path().app_data_dir()`
- 数据库文件：`medex.db`

## 5.2 表结构

### `media`

- `id` INTEGER PK AUTOINCREMENT
- `path` TEXT UNIQUE
- `filename` TEXT
- `type` TEXT (`image` / `video`)
- `is_favorite` INTEGER DEFAULT 0
- `created_at` INTEGER
- `updated_at` INTEGER

### `tags`

- `id` INTEGER PK AUTOINCREMENT
- `name` TEXT UNIQUE

### `media_tags`

- `media_id` INTEGER
- `tag_id` INTEGER
- 复合主键 `(media_id, tag_id)`

### `recent_views`

- `media_id` INTEGER PRIMARY KEY
- `viewed_at` INTEGER

## 5.3 索引

- `idx_media_path` on `media(path)`
- `idx_media_tags_media_id` on `media_tags(media_id)`
- `idx_media_tags_tag_id` on `media_tags(tag_id)`
- `idx_recent_views_viewed_at` on `recent_views(viewed_at DESC)`

---

## 6. Rust Command 清单（对前端暴露）

注册位置：`src-tauri/src/main.rs`

### 6.1 扫描与媒体查询（scanner.rs）

- `scan_and_index(path: String)`
- `get_all_media()`
- `filter_media_by_tags(tag_names: Vec<String>)`
- `filter_media(tag_names: Vec<String>, media_type: Option<String>)`
- `set_media_favorite(media_id: i64, is_favorite: bool)`
- `mark_media_viewed(media_id: i64)`

### 6.2 标签系统（tags.rs）

- `get_all_tags()`
- `get_all_tags_with_count()`
- `create_tag(tag_name: String)`
- `delete_tag(tag_id: i64)`
- `add_tag_to_media(media_id: i64, tag_name: String)`
- `remove_tag_from_media(media_id: i64, tag_id: i64)`
- `get_tags_by_media(media_id: i64)`

### 6.3 缩略图系统（thumbnail/mod.rs）

- `request_thumbnail(path: String)`

---

## 7. 核心功能实现说明

## 7.1 扫描目录并写入数据库

实现：`src-tauri/src/services/scanner.rs`

流程：

1. `walkdir` 递归扫描目录
2. 过滤支持格式
   - 图片：jpg/jpeg/png/webp/gif
   - 视频：mp4/mov/mkv/webm
3. 使用事务批量写入：
   - `INSERT OR IGNORE INTO media (...)`
4. 每处理一个文件发出 `scan_progress`
5. 完成后发出 `scan_done`

优化点：

- `INSERT OR IGNORE` 防重复
- 事务写入提高批量性能
- `walkdir` 错误容错（跳过不可读项）

## 7.2 多标签交集筛选 + 媒体类型筛选

实现：`filter_media`（scanner.rs）

- 无标签时：按 `media_type` 可选过滤后全量返回
- 有标签时：
  - 通过子查询匹配 `t.name IN (...)`
  - `GROUP BY + HAVING COUNT(DISTINCT t.id) = selected_tag_count`
  - 实现“媒体同时拥有所有选中标签（交集）”

## 7.3 标签管理

实现：`src-tauri/src/services/tags.rs`

- 新增标签：`create_tag`
- 删除标签：`delete_tag`（只有 `mediaCount=0` 时允许）
- 给媒体加标签：`add_tag_to_media`
  - 先 `INSERT OR IGNORE tags`
  - 再建 `media_tags` 关系
- 从媒体移除标签：`remove_tag_from_media`
  - 移除关联后若无人使用会自动删除孤立 tag

## 7.4 收藏与最近查看持久化

- 收藏：写入 `media.is_favorite`
- 最近查看：在双击打开 Viewer 时调用 `mark_media_viewed`
  - upsert 到 `recent_views`
  - 自动保留最近 100 条（超出删除最旧）

## 7.5 Viewer（双击全屏查看）

实现：`src/components/MediaViewer.tsx` + `src/App.tsx`

- 双击 MediaCard 打开
- 视频自动播放（`<video controls autoPlay>`）
- 键盘支持：ESC 关闭，左右箭头切换
- 切换时会暂停旧视频

## 7.6 拖拽标签到卡片打标

- 拖拽源：`TagItem.tsx`
- 放置目标：`MediaCard.tsx`
- 技术：`react-dnd + HTML5 backend`，并补充原生 drag data 兼容
- drop 后调用 `add_tag_to_media`，并刷新本地状态/事件

---

## 8. 高性能媒体列表方案

## 8.1 虚拟化渲染

实现：`src/components/MediaGrid.tsx`

- Grid：`FixedSizeGrid`
- List：`FixedSizeList`
- 实际默认固定为 Grid（容器传入 `viewMode="grid"`）
- 仅渲染可见区域 + overscan，显著减少 DOM 数量

## 8.2 缩略图懒加载与优先级调度

实现：`src/containers/MediaGridContainer.tsx`

策略：

- `onItemsRendered` 反馈当前视口范围
- 任务优先级：
  - 可见区域：priority 0
  - 下一屏：priority 1
  - overscan 其余：priority 2
- 去重：
  - 已完成缓存 `thumbnails`
  - 请求中集合 `requestingSet`
  - 队列中集合 `queuedSet`
- 并发限制：`MAX_CONCURRENT = 5`
- 队列上限：`MAX_QUEUE_SIZE = 400`

## 8.3 视频卡片渲染策略

- Grid 中视频不直接挂 `<video>`（避免滚动卡顿）
- 优先显示静态缩略图（后端 ffmpeg 首帧）
- 缩略图未到达时 skeleton 占位
- 只在 Viewer 中挂单个 `<video>` 播放

---

## 9. 缩略图后端系统（Rust）

目录：`src-tauri/src/thumbnail/*`

## 9.1 模块职责

- `mod.rs`：初始化与 command 暴露
- `manager.rs`：任务入口、去重、入队
- `queue.rs`：有界队列（sync_channel）
- `worker.rs`：固定 worker 消费任务
- `utils.rs`：hash、缓存路径、ffmpeg 调用、二进制解析

## 9.2 关键机制

- worker 固定并发：`THUMBNAIL_WORKER_COUNT = 4`
- 队列容量：`THUMBNAIL_QUEUE_CAPACITY = 2048`
- 去重集合：`processing: HashSet<String>`
- 缓存路径：`~/.medex/thumbnails/{hash}.jpg`
- 结果事件：`thumbnail_ready`

## 9.3 ffmpeg 解析策略（当前）

顺序：

1. Tauri resources 内置二进制
2. 开发目录 `src-tauri/binaries`
3. 系统 PATH
4. macOS 常见路径（`/opt/homebrew/bin/ffmpeg`、`/usr/local/bin/ffmpeg`）

若最终不存在：

- `request_thumbnail` 直接返回错误
- 不会再入队阻塞任务流

---

## 10. 前端 UI 结构与现状

## 10.1 实际布局

`App.tsx` 目前渲染：

- 左侧 Sidebar
- 右侧 Main（Toolbar + MediaGrid）
- 全局 TagDragOverlay
- 全屏 MediaViewer

说明：Inspector 组件和容器仍保留代码，但当前 **未挂到主布局**（已隐藏）。

## 10.2 Sidebar

- 导航：All Media / Favorites / Recent
- 标签列表：来自数据库同步（含 `mediaCount`）
- 标签新增输入框 + 新增按钮
- 当标签被选中且 `mediaCount = 0` 时显示删除按钮

## 10.3 Toolbar

- 展示当前激活标签
- 展示筛选结果数量
- 媒体类型切换：All / Image / Video
- 选择文件夹按钮 + 扫描 loading overlay + 进度条

## 10.4 MediaGrid / MediaCard

- Grid 卡片固定尺寸
- 收藏星标（右上角）
- 标签行支持 hover 高亮、点击删除
- 视频 hover 显示播放蒙层；图片不显示播放蒙层

---

## 11. 权限与配置

## 11.1 Tauri Capabilities

文件：`src-tauri/capabilities/default.json`

已启用：

- `core:default`
- `dialog:default`
- `dialog:allow-open`
- `dialog:allow-message`

## 11.2 资源协议

`tauri.conf.json` 中已启用 asset protocol：

- `assetProtocol.enable = true`
- `assetProtocol.scope = ["**"]`

用于本地文件预览（`convertFileSrc`）非常关键。

---

## 12. 开发与运行

## 12.1 安装

```bash
npm install
```

## 12.2 开发

```bash
npm run tauri dev
```

## 12.3 构建

```bash
npm run build
npm run tauri build
```

## 12.4 本地检查

```bash
npm run build
cd src-tauri && cargo check
```

---

## 13. 已知问题与风险点

## 13.1 ffmpeg 分发

当前代码已支持“内置优先 + PATH 回退”，但如果要真正随安装包分发，仍需：

- 准备各平台 ffmpeg 二进制
- 添加 `bundle.externalBin`
- 确认许可与发布体积

> 注意：`externalBin` 一旦配置，缺少对应目标文件会导致构建失败。

## 13.2 缩略图请求释放边界

前端当前以 `thumbnail_ready` 或 invoke 直接返回路径为主来释放请求；若出现异常路径或事件丢失，可能有个别任务滞留。可加“超时回收”机制。

## 13.3 全局事件总线

当前使用 `window.dispatchEvent` 做跨容器同步，灵活但分散。后续建议迁移到：

- Zustand action 编排
- 或统一 query 层（如 TanStack Query）

## 13.4 Inspector 功能未挂载

Inspector 仍有较完整逻辑，但布局中已隐藏。后续若恢复右栏，需要重新对齐 Main 布局宽度与数据同步。

## 13.5 删除媒体流程

UI 层有删除操作入口（Inspector 内），但完整“删文件 + 删 DB + 清缩略图”流程仍需统一设计。

---

## 14. 后续优先级建议（Roadmap）

### P0（建议先做）

1. 完成 ffmpeg 内置打包链路
2. 增加缩略图任务超时与失败重试策略
3. 补齐媒体删除后端 command（含 DB 清理）
4. 增加统一错误提示组件（替换 window.alert）

### P1

1. 复用 Inspector（可折叠右栏）
2. 搜索功能（按文件名/标签模糊搜索）
3. 批量选择与批量打标签/收藏
4. 初步分页加载或增量拉取策略

### P2

1. 后台扫描任务可取消
2. 缩略图优先级升级（按视口位置/交互行为动态提权）
3. 数据迁移框架（schema version + migration）
4. 增加 E2E 自动化（扫描、筛选、打标、viewer）

---

## 15. 关键数据流（端到端）

## 15.1 扫描导入

1. Toolbar 点击“选择文件夹”
2. dialog 选目录
3. invoke `scan_and_index`
4. 后端扫描并写入 DB，持续 emit `scan_progress`
5. emit `scan_done`
6. 前端刷新 `filter_media` 结果并更新 store

## 15.2 标签筛选

1. Sidebar 点击标签切换 selected
2. MediaGridContainer 监听 selectedTags 变化
3. invoke `filter_media(tagNames, mediaType)`
4. store 更新后 MediaGrid 重渲染

## 15.3 视频缩略图

1. MediaGrid 可见范围变化（react-window 回调）
2. MediaGridContainer 按优先级入队
3. invoke `request_thumbnail`
4. 后端队列 + worker 生成缩略图
5. emit `thumbnail_ready`
6. 前端缓存映射更新，卡片展示首帧图

## 15.4 最近查看

1. 双击卡片打开 Viewer
2. invoke `mark_media_viewed(media_id)`
3. `recent_views` upsert 并 trim 到 100
4. 切换到 Recent 导航按 `viewed_at DESC` 展示

---

## 16. 快速排障手册

## 16.1 `dialog.open not allowed`

检查 `src-tauri/capabilities/default.json` 是否包含：

- `dialog:allow-open`
- `dialog:default`

## 16.2 本地文件无法预览（unsupported URL）

确认前端使用 `convertFileSrc(path)`，而不是直接把绝对路径塞给 `<img src>`。

## 16.3 缩略图一直失败

检查：

```bash
which ffmpeg
```

若无输出，需要安装 ffmpeg 或放置内置二进制到 `src-tauri/binaries`。

## 16.4 页面卡顿/白屏

优先排查：

- 是否误在网格内批量挂载 `<video>`
- 是否未启用 react-window 虚拟化
- 缩略图请求并发是否过高（前端 MAX_CONCURRENT）

---

## 17. 代码维护建议

1. 把 `services/scanner.rs` 拆成 `media_query.rs` + `scan.rs` + `recent.rs`，降低文件复杂度。
2. 前端引入 API 类型层（`src/api/types.ts` + `src/api/client.ts`），减少 invoke 字符串分散。
3. 给 store action 增加单元测试（尤其标签计数与本地同步逻辑）。
4. 引入日志分级（info/warn/error）替代散落 `console.log`。
5. 逐步把 `window.dispatchEvent` 迁移为显式 store action。

---

## 18. 发布准备清单（Checklist）

- [ ] ffmpeg 多平台二进制准备完毕
- [ ] `tauri.conf.json` 配置 `bundle.externalBin`
- [ ] 首次启动数据库初始化验证
- [ ] 大目录扫描压力测试（10k+）
- [ ] 大量视频滚动压测（FPS、内存、CPU）
- [ ] 收藏/最近/标签数据持久化回归测试
- [ ] Viewer 快捷键与焦点行为测试
- [ ] macOS/Windows 安装包 smoke test

---

## 19. 附录：关键文件索引

- 前端入口：`src/App.tsx`
- 主布局：`src/components/Main.tsx`
- 媒体网格：`src/components/MediaGrid.tsx`
- 媒体卡片：`src/components/MediaCard.tsx`
- 网格容器（筛选/缩略图调度）：`src/containers/MediaGridContainer.tsx`
- 顶栏容器（扫描与进度）：`src/containers/ToolbarContainer.tsx`
- 侧栏容器（标签同步）：`src/containers/SidebarContainer.tsx`
- 全局状态：`src/store/useAppStore.ts`
- DB 初始化：`src-tauri/src/db/mod.rs`
- 媒体服务：`src-tauri/src/services/scanner.rs`
- 标签服务：`src-tauri/src/services/tags.rs`
- 缩略图系统：`src-tauri/src/thumbnail/*`
- Tauri command 注册：`src-tauri/src/main.rs`

---

如果后续你希望，我可以基于这份文档再补两份：

1. 《发布指南（含 ffmpeg 内置打包）》
2. 《接口文档（前后端 command + TS 类型）》

