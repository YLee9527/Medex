# Medex

Medex 是一个多媒体管理和播放应用，支持视频、图片展示，并可以为每个媒体打标签，进行分类和筛选。项目基于 **React + TypeScript + Tauri V2 + TailwindCSS** 构建，采用三栏式布局：Sidebar / Main / Inspector。

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 项目特性

### V0.1.0 (当前版本)

- **三栏布局**：
  - **Sidebar**：Logo + 导航栏 + 标签列表
  - **Main**：媒体网格（MediaGrid）
  - **Inspector**：选中媒体信息预览 + 标签管理
- **多标签筛选**（UI 占位）
- **MediaCard Hover 效果**（占位）
- **Dark Theme UI**
- **桌面应用支持**：Tauri V2 跨平台桌面框架

### 后续版本计划

- [ ] 媒体文件导入和管理
- [ ] 标签系统完整实现
- [ ] 视频播放器集成
- [ ] 图片预览和缩放
- [ ] 搜索和过滤功能
- [ ] 数据持久化
- [ ] 批量操作支持

---

## 🛠 技术栈

### 前端
- **框架**: React 18.3 + TypeScript 5.5
- **构建工具**: Vite 5.4
- **样式**: TailwindCSS 3.4 + PostCSS + Autoprefixer
- **状态管理**: Zustand 4.5

### 桌面应用
- **框架**: Tauri V2
- **Rust**: 1.77.2+
- **序列化**: Serde 1.0

---

## 📦 安装和运行

### 环境要求

- Node.js 18+ 
- Rust 1.77.2+
- npm 或 pnpm

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Cargo 镜像源（可选，中国大陆推荐）

项目已配置清华大学 Cargo 镜像源，配置文件位于 `src-tauri/.cargo/config.toml`。

### 3. 开发模式

**前端开发模式**（快速迭代 UI）：
```bash
npm run dev
```

**Tauri 完整开发模式**（包含 Rust 后端）：
```bash
npm run tauri dev
```

### 4. 构建生产版本

```bash
npm run build
npm run tauri build
```

构建产物位于 `src-tauri/target/release/`

### 5. 预览构建结果

```bash
npm run preview
```

---

## 📁 项目结构

```
Medex/
├── src/                      # 前端源代码
│   ├── components/           # React 组件
│   │   ├── Sidebar.tsx       # 侧边栏组件
│   │   ├── Main.tsx          # 主内容区组件
│   │   └── Inspector.tsx     # 检查器组件
│   ├── App.tsx               # 应用入口
│   └── main.tsx              # React 入口
├── src-tauri/                # Tauri/Rust 后端
│   ├── .cargo/
│   │   └── config.toml       # Cargo 配置（镜像源）
│   ├── src/
│   │   └── main.rs           # Rust 入口
│   ├── Cargo.toml            # Rust 依赖配置
│   └── tauri.conf.json       # Tauri 配置
├── package.json              # Node.js 依赖配置
├── tailwind.config.js        # TailwindCSS 配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

---

## 🎨 组件说明

### Sidebar
- 应用导航
- 标签分类列表
- Logo 展示

### Main
- 媒体文件网格展示
- 媒体卡片（MediaCard）
- 悬停交互效果

### Inspector
- 选中媒体的详细信息
- 标签编辑和管理
- 属性预览

---

## 🔧 开发指南

### 添加新组件

```bash
# 在 src/components/ 目录创建新组件
touch src/components/NewComponent.tsx
```

### 安装新的依赖

```bash
# 前端依赖
npm install package-name

# Rust 依赖（在 src-tauri 目录）
cd src-tauri
cargo add package-name
```

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置（如已配置）
- 组件使用函数式写法
- 使用 TailwindCSS 进行样式编写

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 作者：you
- 项目仓库：[GitHub](https://github.com/yourusername/medex)

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [Tauri](https://tauri.app/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

*Last updated: 2026-04-02*
