# Medex 发布指南（Release Guide）

更新时间：2026-04-03  
适用仓库：`/Users/terryyoung/Documents/projects/personal/Medex`

---

## 1. 目标

本指南用于把 Medex 从开发态发布为可安装桌面应用，并重点解决：

- 多平台打包（macOS / Windows）
- ffmpeg 内置分发（用户无需自行安装）
- 发布前验证与回归检查

---

## 2. 当前发布基础

项目当前已经具备：

- Tauri v2 打包基础配置
- SQLite 本地持久化
- 视频缩略图系统（依赖 ffmpeg）
- 前端性能优化（react-window + 懒加载）

当前 `tauri.conf.json` 的 `bundle.externalBin` 处于关闭状态（为了避免缺少二进制时构建失败）。

---

## 3. 版本与环境要求

## 3.1 构建机要求

- Node.js 18+
- Rust（建议 stable 最新）
- Tauri CLI v2
- macOS 打包需要 Xcode Command Line Tools
- Windows 打包需要 Visual Studio Build Tools（MSVC）

## 3.2 命令校验

```bash
node -v
rustc -V
cargo -V
npm -v
npx tauri -V
```

---

## 4. 发布产物结构建议

建议在仓库内维护一个发布资源目录：

```text
src-tauri/
├── binaries/
│   ├── ffmpeg-aarch64-apple-darwin
│   ├── ffmpeg-x86_64-apple-darwin
│   └── ffmpeg-x86_64-pc-windows-msvc.exe
└── tauri.conf.json
```

说明：

- 文件名需与 Tauri 目标三元组对应。
- macOS 两个架构建议都准备，方便多机型分发。

---

## 5. ffmpeg 二进制准备

## 5.1 许可与来源

发布前请确认 ffmpeg 来源与许可证合规（尤其是否包含 GPL 组件）。

## 5.2 本机快速准备（Apple Silicon 开发机）

```bash
brew install ffmpeg
mkdir -p /Users/terryyoung/Documents/projects/personal/Medex/src-tauri/binaries
cp /opt/homebrew/bin/ffmpeg /Users/terryyoung/Documents/projects/personal/Medex/src-tauri/binaries/ffmpeg-aarch64-apple-darwin
chmod +x /Users/terryyoung/Documents/projects/personal/Medex/src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

## 5.3 其他平台二进制

- Intel macOS：准备 `ffmpeg-x86_64-apple-darwin`
- Windows：准备 `ffmpeg-x86_64-pc-windows-msvc.exe`

建议在 CI 产物仓库统一管理这些二进制，避免开发机手工拷贝导致版本漂移。

---

## 6. 打开 Tauri externalBin 配置

在 `src-tauri/tauri.conf.json` 的 `bundle` 中加入：

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "externalBin": ["binaries/ffmpeg"]
  }
}
```

注意事项：

- 一旦启用 `externalBin`，构建时会要求对应平台文件存在。
- 若缺少例如 `ffmpeg-aarch64-apple-darwin`，构建会直接失败。

---

## 7. 发布前检查清单（必须）

## 7.1 代码与依赖

- [ ] `npm ci` 通过
- [ ] `npm run build` 通过
- [ ] `cd src-tauri && cargo check` 通过

## 7.2 功能回归

- [ ] 扫描 100+ 文件无卡死
- [ ] 缩略图能逐步生成并显示
- [ ] 标签新增/删除/筛选正常
- [ ] 收藏状态刷新后不丢失
- [ ] Recent 列表按时间倒序，最多 100 条
- [ ] 双击 Viewer、键盘切换正常

## 7.3 发布体验

- [ ] 首次安装后无需手动安装 ffmpeg
- [ ] 本地图片和视频可正常预览
- [ ] 缩略图缓存目录可写（`~/.medex/thumbnails`）

---

## 8. 本地打包流程

## 8.1 清理构建缓存（可选）

```bash
rm -rf /Users/terryyoung/Documents/projects/personal/Medex/dist
rm -rf /Users/terryyoung/Documents/projects/personal/Medex/src-tauri/target
```

## 8.2 执行打包

```bash
cd /Users/terryyoung/Documents/projects/personal/Medex
npm run tauri build
```

## 8.3 产物位置

通常位于：

- `src-tauri/target/release/bundle/`

按平台会生成 `.app/.dmg`、`.msi/.exe` 等。

---

## 9. 安装后验证（Smoke Test）

建议在“干净机器”执行以下最小验证：

1. 启动应用，确认无白屏。
2. 选择包含图片和视频的目录扫描。
3. 检查扫描进度 overlay 和完成提示。
4. 检查网格滚动流畅度。
5. 双击视频进入 Viewer，可播放。
6. 关闭应用后重开，验证收藏、Recent、标签关系仍存在。

---

## 10. CI/CD 建议

## 10.1 分支策略

- `main`：稳定发布线
- `release/*`：发布候选
- `codex/*`：功能开发线

## 10.2 CI 阶段建议

1. Install（Node + Rust）
2. Frontend build（`npm run build`）
3. Rust check（`cargo check`）
4. Tauri build（按平台矩阵）
5. Artifact upload（安装包 + 校验值）

## 10.3 制品命名建议

- `medex-v{version}-{platform}-{arch}.{ext}`

示例：

- `medex-v0.1.0-macos-aarch64.dmg`
- `medex-v0.1.0-windows-x64.msi`

---

## 11. 常见发布错误与处理

## 11.1 `resource path binaries/ffmpeg-xxx doesn't exist`

原因：已启用 `externalBin` 但缺少对应目标文件。  
处理：补齐 `src-tauri/binaries/ffmpeg-{target}`。

## 11.2 `failed to start ffmpeg process: No such file or directory`

原因：运行时 ffmpeg 未找到。  
处理：

- 确认发布包是否包含二进制
- 确认运行时解析顺序命中（resources/dev/PATH）
- 确认二进制有执行权限

## 11.3 图标相关构建失败

原因：`src-tauri/icons/*` 缺失或格式不正确。  
处理：确保至少存在有效 PNG 图标，且为 RGBA。

---

## 12. 安全与合规建议

1. 明确第三方二进制来源和版本。
2. 在发布说明中标注 ffmpeg 许可证信息。
3. 对外发布时附带完整 OSS NOTICE（如有要求）。
4. 对用户输入路径做严格错误处理，避免 panic。

---

## 13. 建议的发布节奏

- 小版本（0.x.y）：每周或双周
- 大版本（x.0.0）：按功能里程碑
- 每次发布至少包含：
  - 变更日志
  - 回滚方案
  - 已知问题

---

## 14. 发布操作模板（可直接复用）

```bash
# 1) 切到发布分支
git checkout -b release/v0.1.0

# 2) 安装依赖
npm ci

# 3) 前端构建
npm run build

# 4) Rust 检查
cd src-tauri && cargo check && cd ..

# 5) Tauri 打包
npm run tauri build

# 6) 记录产物
ls -la src-tauri/target/release/bundle
```

---

## 15. 后续增强建议

1. 增加自动更新（Tauri updater）。
2. 增加发布签名和校验。
3. 用 CI 自动注入 ffmpeg 并校验可执行权限。
4. 增加安装后首启自检页面（DB、ffmpeg、目录权限）。

