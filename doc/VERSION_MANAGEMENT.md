# Medex 版本集中管理指南

## 📦 版本管理方案

项目现在支持集中版本管理，只需在一个地方修改版本号，所有配置文件会自动同步。

## 🎯 主版本文件

**`version.properties`** - 这是唯一的版本来源（Source of Truth）

```properties
VERSION=0.8.6
```

## 🔄 同步方式

### 方式 1：自动同步（推荐）

修改 `version.properties` 后，运行：

```bash
# 同步到所有配置文件
npm run sync-version
```

或：

```bash
# 使用 shell 脚本
./scripts/sync-version.sh
```

### 方式 2：手动同步

1. **修改 `version.properties`**
   ```properties
   VERSION=1.0.0
   ```

2. **运行同步脚本**
   ```bash
   npm run sync-version
   ```

3. **验证同步结果**
   - ✅ `package.json` - 自动更新
   - ✅ `tauri.conf.json` - 自动更新
   - ✅ `Cargo.toml` - 自动更新

## 📋 配置文件说明

### 1. version.properties（主版本）
- **位置**: `/version.properties`
- **作用**: 存储主版本号
- **同步**: 手动修改

### 2. package.json（前端版本）
- **位置**: `/package.json`
- **作用**: NPM 包版本
- **同步**: 运行 `npm run sync-version` 自动更新

### 3. tauri.conf.json（Tauri 配置）
- **位置**: `/src-tauri/tauri.conf.json`
- **作用**: Tauri 应用版本
- **同步**: 运行 `npm run sync-version` 自动更新

### 4. Cargo.toml（Rust 版本）
- **位置**: `/src-tauri/Cargo.toml`
- **作用**: Rust 包版本
- **同步**: 运行 `npm run sync-version` 自动更新

## 🚀 发布新版本流程

```bash
# 1. 修改 version.properties
VERSION=1.0.0

# 2. 同步到所有配置文件
npm run sync-version

# 3. 构建项目
npm run tauri build

# 4. 提交更改
git add version.properties package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: release version 1.0.0"
```

## 🛠️ 自动化建议

### Git Hook 自动同步

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
# 自动同步版本号
if [ -f version.properties ]; then
  npm run sync-version
  git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
fi
```

### CI/CD 集成

在 CI/CD 流程中：
1. 读取 `version.properties`
2. 运行 `npm run sync-version`
3. 构建和发布

## ⚠️ 注意事项

1. **Cargo.toml 版本**: 通过同步脚本直接更新版本号
2. **tauri.conf.json 版本**: 已通过同步脚本自动更新
3. **版本号格式**: 遵循语义化版本（Semantic Versioning）：`MAJOR.MINOR.PATCH`

## 📝 版本历史

- **0.8.6** - 当前版本
- **0.1.0** - 初始版本
