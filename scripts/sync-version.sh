# 版本同步脚本
# 使用方法：修改 version.properties 中的 VERSION 后，运行此脚本自动同步到所有配置文件

# 加载环境变量
if [ -f version.properties ]; then
  export $(grep -v '^#' version.properties | xargs)
  echo "✅ 已加载版本号：$VERSION"
else
  echo "❌ 未找到 version.properties 文件"
  exit 1
fi

# 同步到 package.json 和 tauri.conf.json
echo "📦 同步到 package.json 和 tauri.conf.json..."
node scripts/sync-version.js

# 验证 Cargo.toml
echo "🦀 验证 Cargo.toml..."
if grep -q 'version = env("CARGO_PKG_VERSION")' src-tauri/Cargo.toml; then
  echo "   ✅ Cargo.toml 配置为使用环境变量：CARGO_PKG_VERSION=$VERSION"
else
  echo "   ⚠️  Cargo.toml 未配置为使用环境变量"
fi

echo ""
echo "🎉 版本同步完成！"
echo "   主版本号：$VERSION"
echo "   配置文件:"
echo "   - version.properties (主版本)"
echo "   - package.json (已更新)"
echo "   - tauri.conf.json (已更新)"
echo "   - Cargo.toml (构建时自动读取)"
