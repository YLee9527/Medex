#!/usr/bin/env node

/**
 * 版本同步脚本
 * 从 version.properties 读取版本号并同步到 package.json、tauri.conf.json 和 Cargo.toml
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 version.properties
const versionPropertiesPath = join(__dirname, '..', 'version.properties');
const versionPropertiesContent = readFileSync(versionPropertiesPath, 'utf-8');

// 解析版本号
const versionMatch = versionPropertiesContent.match(/^VERSION=(.+)$/m);
if (!versionMatch) {
  console.error('❌ 未在 version.properties 中找到 VERSION');
  process.exit(1);
}

const version = versionMatch[1].trim();
console.log(`📦 读取版本号：${version}`);

// 同步到 package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const oldPackageVersion = packageJson.version;
packageJson.version = version;

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
console.log(`✅ package.json 已更新：${oldPackageVersion} → ${version}`);

// 同步到 tauri.conf.json
const tauriConfigPath = join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'));

const oldTauriVersion = tauriConfig.version;
tauriConfig.version = version;

writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n', 'utf-8');
console.log(`✅ tauri.conf.json 已更新：${oldTauriVersion} → ${version}`);

// 同步到 Cargo.toml
const cargoTomlPath = join(__dirname, '..', 'src-tauri', 'Cargo.toml');
let cargoTomlContent = readFileSync(cargoTomlPath, 'utf-8');

// 使用正则表达式替换 version 行
const oldCargoVersionMatch = cargoTomlContent.match(/^version = "([^"]+)"/m);
if (oldCargoVersionMatch) {
  cargoTomlContent = cargoTomlContent.replace(
    /^version = "[^"]+"/m,
    `version = "${version}"`
  );
  writeFileSync(cargoTomlPath, cargoTomlContent, 'utf-8');
  console.log(`✅ Cargo.toml 已更新：${oldCargoVersionMatch[1]} → ${version}`);
}

console.log('\n🎉 版本同步完成！');
console.log(`   新版本：${version}`);
console.log(`   已同步:`);
console.log(`   - package.json`);
console.log(`   - tauri.conf.json`);
console.log(`   - Cargo.toml`);
