# 🚀 Medex 发布快速参考

## 📦 发布步骤

```bash
# 1. 修改版本号
vim version.properties
# 将 VERSION=0.8.6 改为 VERSION=1.0.0

# 2. 执行发布（自动完成所有操作）
npm run deploy
```

## 🎯 一键发布流程

```
修改 version.properties
    ↓
npm run deploy
    ↓
├─ 同步版本号
├─ 提交到 Git
├─ 推送到远程
├─ 创建 tag
└─ 推送 tag
    ↓
GitHub Actions 自动触发
```

## 📋 发布清单

- [ ] 修改 `version.properties` 中的版本号
- [ ] 运行 `npm run deploy`
- [ ] 检查发布输出
- [ ] 验证 GitHub Actions 触发
- [ ] 确认 GitHub Releases 生成

## ⚡ 常用命令

```bash
# 查看当前版本
cat version.properties | grep VERSION

# 查看已发布的 tag
git tag -l

# 查看最近版本
git describe --tags --abbrev=0

# 手动发布（如果自动脚本失败）
npm run sync-version
git add version.properties package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: release version 1.0.0"
git push
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 🔍 验证发布

```bash
# 1. 检查本地文件
cat version.properties
cat package.json | grep version
cat src-tauri/tauri.conf.json | grep version
cat src-tauri/Cargo.toml | grep version

# 2. 检查 Git tag
git tag -l | grep "v1.0.0"

# 3. 检查远程 tag
git ls-remote origin refs/tags/v1.0.0

# 4. 检查 GitHub Actions
# 访问：https://github.com/YLee9527/Medex/actions

# 5. 检查 GitHub Releases
# 访问：https://github.com/YLee9527/Medex/releases
```

## ⚠️ 常见问题

| 问题 | 解决方案 |
|------|---------|
| Tag 已存在 | 使用新版本号或删除旧 tag |
| 推送失败 | 检查网络和 Git 权限 |
| 不在 main 分支 | 切换到 main 或确认继续 |
| 没有更改提交 | 正常，继续执行 |

## 📞 需要帮助？

查看完整文档：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
