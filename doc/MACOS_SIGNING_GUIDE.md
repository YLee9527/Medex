# macOS 应用签名和公证指南

## 问题说明

当你尝试打开自己构建的 macOS 应用时，可能会看到：
> "Medex.app"已损坏，无法打开。你应该将它移到废纸篓。

这是因为 macOS 的安全机制要求所有应用都必须经过 Apple 签名和公证。

## 解决方案

### 方案 1：开发环境（推荐用于测试）

#### 临时解决方法
```bash
# 移除隔离属性
xattr -cr /path/to/Medex.app

# 或者在构建时添加开发标志
npm run tauri dev
```

#### 永久开发证书
1. 打开 **Keychain Access**（钥匙串访问）
2. 菜单 → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
3. 输入你的 Apple ID，选择 "Saved to disk"
4. 访问 [Apple Developer](https://developer.apple.com/account)
5. 创建 **Development Certificate**
6. 导入证书到 Keychain

### 方案 2：生产环境（正式发布）

#### 前置条件
1. **Apple Developer Program** 会员（$99/年）
2. **Developer ID Application** 证书
3. **Notarization** 工具访问权限

#### 步骤

##### 1. 获取证书
```bash
# 安装 Xcode
xcode-select --install

# 安装 Xcode Command Line Tools
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 登录 App Store Connect
xcrun notarytool store-credentials "MedexProfile" \
  --apple-id "your-apple-id@example.com" \
  --team-id "YOUR_TEAM_ID" \
  --password "your-app-specific-password"
```

##### 2. 配置构建脚本
创建 `.env` 文件：
```bash
# Apple ID 相关
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=YOUR_TEAM_ID

# 证书名称（在 Keychain 中的名称）
APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
```

##### 3. 修改 CI/CD 配置
编辑 `.github/workflows/main.yml`，添加签名配置：

```yaml
- name: Build macOS App
  run: npm run tauri build
  env:
    APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

##### 4. 公证应用
```bash
# 构建完成后公证
xcrun notarytool submit "src-tauri/target/release/bundle/macos/Medex.app" \
  --keychain-profile "MedexProfile" \
  --wait

# 附加公证凭证（Staple）
xcrun stapler staple "src-tauri/target/release/bundle/macos/Medex.app"
```

### 方案 3：使用 GitHub Actions 自动签名

#### 设置 Secrets
在 GitHub 仓库设置中添加：
- `APPLE_CERTIFICATE` - P12 格式的证书（Base64 编码）
- `APPLE_CERTIFICATE_PASSWORD` - 证书密码
- `APPLE_ID` - Apple ID
- `APPLE_PASSWORD` - 应用专用密码
- `APPLE_TEAM_ID` - Team ID

#### 示例工作流
```yaml
- name: Import Apple Certificate
  run: |
    echo $APPLE_CERTIFICATE | base64 --decode > certificate.p12
    security create-keychain -p "" build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p "" build.keychain
    security import certificate.p12 -k build.keychain -P $APPLE_CERTIFICATE_PASSWORD -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain

- name: Build and Notarize
  run: npm run tauri build
  env:
    APPLE_SIGNING_IDENTITY: "Developer ID Application: Your Name"
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

- name: Notarize App
  run: |
    xcrun notarytool submit src-tauri/target/release/bundle/macos/Medex.app \
      --apple-id $APPLE_ID \
      --password $APPLE_PASSWORD \
      --team-id $APPLE_TEAM_ID \
      --wait
    xcrun stapler staple src-tauri/target/release/bundle/macos/Medex.app
```

## 快速测试（当前应用）

如果只是想在本地测试，运行：

```bash
# 方法 1：移除隔离属性
xattr -cr /Applications/Medex.app

# 方法 2：使用开发模式
cd /Users/terryyoung/Documents/projects/personal/Medex
npm run tauri dev
```

## 常见问题

### Q: 什么是应用专用密码？
A: 访问 [appleid.apple.com](https://appleid.apple.com/) → 安全 → 应用专用密码 → 生成新密码

### Q: 如何查看 Team ID？
A: 访问 [Apple Developer](https://developer.apple.com/account) → Membership → Team ID

### Q: 公证需要多长时间？
A: 通常 1-5 分钟，首次可能稍长

### Q: 可以跳过公证吗？
A: 可以，但用户需要手动在系统偏好设置中允许运行

## 参考资源

- [Tauri 官方文档 - macOS 签名](https://tauri.app/distribute/signing/macos/)
- [Apple Notarization 文档](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Actions 示例](https://github.com/tauri-apps/tauri-action)
