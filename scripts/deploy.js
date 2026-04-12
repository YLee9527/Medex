#!/usr/bin/env node

/**
 * 自动发布脚本
 * 流程：
 * 1. 从 version.properties 读取版本号
 * 2. 同步版本号到所有配置文件
 * 3. 检查是否有未提交的更改
 * 4. 提交更改
 * 5. 推送到远程
 * 6. 创建并推送 tag
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    throw new Error(`命令执行失败：${command}\n${error.message}`);
  }
}

// 主函数
async function main() {
  // 步骤 1: 读取版本号
  log('\n📦 步骤 1: 读取版本号...', 'cyan');
  const versionPropertiesPath = join(__dirname, '..', 'version.properties');
  const versionPropertiesContent = readFileSync(versionPropertiesPath, 'utf-8');
  const versionMatch = versionPropertiesContent.match(/^VERSION=(.+)$/m);

  if (!versionMatch) {
    log('❌ 未在 version.properties 中找到 VERSION', 'red');
    process.exit(1);
  }

  const version = versionMatch[1].trim();
  log(`✅ 版本号：v${version}`, 'green');

  // 步骤 2: 同步版本号
  log('\n🔄 步骤 2: 同步版本号到所有配置文件...', 'cyan');
  try {
    exec('npm run sync-version');
    log('✅ 版本号同步完成', 'green');
  } catch (error) {
    log('❌ 版本号同步失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // 步骤 3: 检查 Git 状态
  log('\n🔍 步骤 3: 检查 Git 状态...', 'cyan');
  try {
    const status = exec('git status --porcelain');
    if (status.trim()) {
      log('📝 有以下文件需要提交:', 'yellow');
      log(status, 'yellow');
    } else {
      log('✅ 没有需要提交的文件更改', 'green');
    }
  } catch (error) {
    log('❌ 无法获取 Git 状态，请确保当前是 Git 仓库', 'red');
    process.exit(1);
  }

  // 步骤 4: 检查当前分支
  log('\n🔍 步骤 4: 检查当前分支...', 'cyan');
  const currentBranch = exec('git branch --show-current').trim();
  log(`当前分支：${currentBranch}`, 'blue');

  if (currentBranch !== 'main') {
    log('⚠️  警告：当前不在 main 分支上', 'yellow');
    log('发布应该在 main 分支上进行', 'yellow');
    const confirm = prompt('是否继续？(y/n): ');
    if (confirm !== 'y' && confirm !== 'Y') {
      log('❌ 发布已取消', 'red');
      process.exit(1);
    }
  }

  // 步骤 5: 检查 tag 是否存在
  log('\n🔍 步骤 5: 检查 tag 是否存在...', 'cyan');
  try {
    const tagExists = exec(`git tag -l v${version}`).trim();
    if (tagExists) {
      log(`❌ Tag v${version} 已存在！`, 'red');
      log('请使用不同的版本号，或者删除已有的 tag', 'red');
      process.exit(1);
    }
    log(`✅ Tag v${version} 不存在，可以创建`, 'green');
  } catch (error) {
    log('❌ 无法检查 tag，请确保 Git 仓库正常', 'red');
    process.exit(1);
  }

  // 等待 Cargo.lock 生成
  log('\n⏳ 等待 Cargo.lock 生成...', 'cyan');
  await new Promise(resolve => setTimeout(resolve, 5000));
  log('✅ 等待完成', 'green');

  // 步骤 6: 提交更改
  log('\n💾 步骤 6: 提交更改...', 'cyan');
  try {
    exec('git add version.properties package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock');
    exec(`git commit -m "chore: release version ${version}"`);
    log(`✅ 提交成功：chore: release version ${version}`, 'green');
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      log('⚠️  没有文件更改需要提交', 'yellow');
    } else {
      log('❌ 提交失败', 'red');
      log(error.message, 'red');
      process.exit(1);
    }
  }

  // 步骤 7: 推送到远程
  log('\n🚀 步骤 7: 推送到远程仓库...', 'cyan');
  try {
    exec('git push');
    log('✅ 推送成功', 'green');
  } catch (error) {
    log('❌ 推送失败', 'red');
    log(error.message, 'red');
    log('\n💡 提示：请检查远程仓库连接和权限', 'yellow');
    process.exit(1);
  }

  // 步骤 8: 创建 tag
  log('\n🏷️  步骤 8: 创建 tag...', 'cyan');
  try {
    exec(`git tag -a v${version} -m "Release version ${version}"`);
    log(`✅ Tag v${version} 创建成功`, 'green');
  } catch (error) {
    log('❌ 创建 tag 失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // 步骤 9: 推送 tag
  log('\n🚀 步骤 9: 推送 tag 到远程仓库...', 'cyan');
  try {
    exec(`git push origin v${version}`);
    log(`✅ Tag v${version} 推送成功`, 'green');
    log('\n🎉 发布完成！', 'green');
    log(`\n📋 发布摘要:`, 'cyan');
    log(`   版本：v${version}`, 'blue');
    log(`   分支：${currentBranch}`, 'blue');
    log(`   Tag: v${version}`, 'blue');
    log(`\n🔗 GitHub Actions 将自动触发构建和发布`, 'green');
  } catch (error) {
    log('❌ 推送 tag 失败', 'red');
    log(error.message, 'red');
    log('\n💡 提示：tag 已创建但未推送到远程', 'yellow');
    log(`   可以手动执行：git push origin v${version}`, 'yellow');
    process.exit(1);
  }
}

// 执行主函数
main().catch((error) => {
  log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
