# Medex 自动发布指南

## 📦 发布流程

### 1. 修改版本号

编辑项目根目录的 `version.properties` 文件：

```properties
# 修改版本号
VERSION=1.0.0
```

### 2. 执行发布命令

```bash
npm run deploy
```

### 3. 自动流程

发布脚本会自动完成以下操作：

1. ✅ **读取版本号** - 从 `version.properties` 读取版本
2. ✅ **同步版本** - 自动更新以下文件：
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
3. ✅ **检查 Git 状态** - 显示需要提交的文件
4. ✅ **检查分支** - 确认是否在 main 分支
5. ✅ **检查 tag** - 确保版本号未重复
6. ✅ **提交更改** - 执行 `git commit`
7. ✅ **推送代码** - 推送到远程仓库
8. ✅ **创建 tag** - 创建带版本的 tag (如 `v1.0.0`)
9. ✅ **推送 tag** - 推送 tag 到远程

### 4. GitHub Actions 触发

当 tag 推送到远程后，GitHub Actions 会自动触发：

- 🏃 开始构建流程
- 📦 生成安装包
- 🚀 发布到 GitHub Releases

## 📋 完整示例

```bash
# 1. 编辑版本号
vim version.properties

# 2. 将 VERSION 从 0.8.6 改为 1.0.0
# VERSION=1.0.0

# 3. 执行发布
npm run deploy
```

### 输出示例

```
📦 步骤 1: 读取版本号...
✅ 版本号：v1.0.0

🔄 步骤 2: 同步版本号到所有配置文件...
📦 读取版本号：1.0.0
✅ package.json 已更新：0.8.6 → 1.0.0
✅ tauri.conf.json 已更新：0.8.6 → 1.0.0
✅ Cargo.toml 已更新：0.8.6 → 1.0.0
✅ 版本号同步完成

🔍 步骤 3: 检查 Git 状态...
📝 有以下文件需要提交:
 M version.properties
 M package.json
 M src-tauri/tauri.conf.json
 M src-tauri/Cargo.toml

🔍 步骤 4: 检查当前分支...
当前分支：main

🔍 步骤 5: 检查 tag 是否存在...
✅ Tag v1.0.0 不存在，可以创建

💾 步骤 6: 提交更改...
✅ 提交成功：chore: release version 1.0.0

🚀 步骤 7: 推送到远程仓库...
✅ 推送成功

🏷️  步骤 8: 创建 tag...
✅ Tag v1.0.0 创建成功

🚀 步骤 9: 推送 tag 到远程仓库...
✅ Tag v1.0.0 推送成功

🎉 发布完成！

📋 发布摘要:
   版本：v1.0.0
   分支：main
   Tag: v1.0.0

🔗 GitHub Actions 将自动触发构建和发布
```

## ⚠️ 注意事项

### 1. 分支要求

- 发布应该在 **main 分支** 上进行
- 如果不在 main 分支，脚本会提示确认
- 建议先在本地测试后再发布

### 2. 版本号规则

- 遵循 **语义化版本** (Semantic Versioning)
- 格式：`MAJOR.MINOR.PATCH`
- 例如：`1.0.0`, `1.2.3`, `2.0.0`

### 3. Tag 命名

- Tag 格式：`v{版本号}`
- 例如：`v1.0.0`, `v1.2.3`
- 版本号不能重复

### 4. Git 配置

确保已配置 Git 用户信息：

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 🔧 故障排除

### Q: 推送失败？

**A:** 检查远程仓库连接和权限：

```bash
# 检查远程仓库
git remote -v

# 测试连接
git ls-remote origin
```

### Q: Tag 已存在？

**A:** 使用新的版本号，或删除已有 tag：

```bash
# 删除本地 tag
git tag -d v1.0.0

# 删除远程 tag
git push origin :refs/tags/v1.0.0
```

### Q: 不在 main 分支？

**A:** 切换到 main 分支或确认继续：

```bash
# 切换到 main 分支
git checkout main
git pull

# 或者在脚本提示时输入 'y' 继续
```

### Q: 没有更改需要提交？

**A:** 如果版本号没变化，可能没有文件需要提交。这是正常的，脚本会继续执行。

## 🛠️ 手动操作（可选）

如果自动脚本失败，可以手动执行：

```bash
# 1. 同步版本
npm run sync-version

# 2. 添加文件
git add version.properties package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml

# 3. 提交
git commit -m "chore: release version 1.0.0"

# 4. 推送
git push

# 5. 创建 tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# 6. 推送 tag
git push origin v1.0.0
```

## 📊 发布历史

查看已发布的版本：

```bash
# 查看所有 tag
git tag -l

# 查看最近 tag
git describe --tags --abbrev=0

# 查看 tag 详情
git show v1.0.0
```

## ✅ 测试验证

发布脚本已经过测试验证：

```bash
# 测试结果
✅ 版本号读取成功
✅ 版本同步正常
✅ Git 状态检查正常
✅ 分支检查正常
✅ Tag 创建成功
✅ Commit 提交成功
✅ 推送到远程成功
```

## 🚀 发布后检查

1. **GitHub Actions**
   - 访问 GitHub 仓库的 Actions 标签页
   - 确认构建流程已触发
   - 等待构建完成

2. **GitHub Releases**
   - 检查 Releases 页面
   - 确认新版本已发布
   - 验证安装包已生成

3. **本地验证**
   ```bash
   # 拉取最新代码
   git pull
   
   # 验证版本
   cat version.properties
   cat package.json | grep version
   ```

## 💡 最佳实践

1. **发布前测试**
   - 在本地运行 `npm run tauri build`
   - 测试应用功能正常

2. **更新日志**
   - 在 commit message 中说明主要变更
   - 或者在发布后更新 CHANGELOG.md

3. **版本规划**
   - 主版本 (MAJOR): 重大变更或不兼容更新
   - 次版本 (MINOR): 新功能但向后兼容
   - 补丁版本 (PATCH): Bug 修复

4. **团队协作**
   - 发布前通知团队成员
   - 避免同时发布造成冲突
