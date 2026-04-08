# 📦 Medex 版本管理快速参考

## 🎯 核心概念

**只需在一个地方修改版本号，所有配置文件自动同步！**

## 📝 修改版本号

### 1. 编辑 `version.properties`
```properties
VERSION=1.0.0
```

### 2. 运行同步脚本
```bash
npm run sync-version
```

### 3. 验证
```bash
# 查看所有版本是否一致
cat version.properties | grep VERSION
cat package.json | grep version
cat src-tauri/tauri.conf.json | grep version
```

## 🔄 自动同步的配置文件

| 文件 | 同步方式 | 说明 |
|------|---------|------|
| `version.properties` | 手动修改 | **主版本来源** |
| `package.json` | 自动同步 | 前端版本 |
| `tauri.conf.json` | 自动同步 | Tauri 应用版本 |
| `Cargo.toml` | 构建时自动读取 | Rust 版本（通过 `build.rs`） |

## 🚀 发布流程

```bash
# 1. 修改版本号
vim version.properties

# 2. 同步版本
npm run sync-version

# 3. 构建应用
npm run tauri build

# 4. 提交发布
git add version.properties package.json src-tauri/tauri.conf.json
git commit -m "chore: release version 1.0.0"
git tag v1.0.0
git push && git push --tags
```

## 🛠️ 技术实现

### version.properties
- 简单的键值对格式
- 易于解析和修改
- 跨平台兼容

### build.rs (Rust)
```rust
// 在构建时读取 version.properties
// 设置 CARGO_PKG_VERSION 环境变量
println!("cargo:rustc-env=CARGO_PKG_VERSION={}", version);
```

### Cargo.toml
```toml
[package]
version = env("CARGO_PKG_VERSION")  # 使用环境变量
```

### sync-version.js (Node.js)
- 读取 `version.properties`
- 更新 `package.json`
- 更新 `tauri.conf.json`

## ⚡ 常用命令

```bash
# 查看当前版本
cat version.properties | grep VERSION

# 同步版本
npm run sync-version

# 使用 shell 脚本（包含验证）
./scripts/sync-version.sh

# 构建项目（自动使用新版本）
npm run tauri build
```

## 🔍 故障排查

### Q: Cargo.toml 版本没更新？
A: `Cargo.toml` 使用 `env("CARGO_PKG_VERSION")`，在构建时自动读取，无需手动更新。

### Q: tauri.conf.json 版本不对？
A: 运行 `npm run sync-version` 会自动更新。

### Q: 如何回退版本？
A: 修改 `version.properties` 为旧版本，重新运行 `npm run sync-version`。

## 📚 详细文档

查看 [`VERSION_MANAGEMENT.md`](./VERSION_MANAGEMENT.md) 了解更多细节。
