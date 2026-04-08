# Medex 产品文档（V0）

## 1️⃣ 产品概述

**产品名称**：Medex  

**产品定位**：  
Medex 是一款桌面多媒体管理和播放软件，支持视频、图片等多种格式的展示。用户可以为每个媒体打多个标签，实现分类和筛选功能。  

**核心理念**：  
- **高效管理**：快速浏览和分类媒体  
- **可视化操作**：直观三栏布局  
- **可扩展**：易于增加新功能和组件  

---

## 2️⃣ 目标用户

- 设计师 / UI 素材管理者  
- 媒体编辑 / 视频剪辑者  
- 多媒体内容创作者  

---

## 3️⃣ 功能需求

### 核心功能（V0）

1. **媒体展示**
   - 支持多种格式：图片、视频
   - MediaCard 栅格展示
   - Hover 显示播放图标

2. **标签管理**
   - 每个媒体可打多个标签
   - Sidebar 标签多选筛选
   - Inspector 标签编辑（增删）

3. **三栏布局**
   - **Sidebar**：Logo + 导航栏 + 标签列表  
   - **Main**：媒体网格显示  
   - **Inspector**：选中媒体详情 + 标签信息

4. **Dark Theme UI**
   - Sidebar / Inspector 背景 #1E1E1E  
   - Main 背景 #101010  
   - 文本颜色 #EAEAEA  

---

### 可选功能（后续版本）
- Grid/List 切换  
- 搜索栏和快速筛选  
- 拖拽排序 MediaCard  
- 本地数据库存储标签和媒体信息  

---

## 4️⃣ UI 布局与组件

### 布局概述

```
App
├─ Sidebar
│   ├─ Logo
│   ├─ NavigationItem[]
│   └─ TagList
│        └─ TagItem[]
├─ Main
│   ├─ Toolbar
│   └─ MediaGrid
│        └─ MediaCard[]
└─ Inspector
    ├─ PreviewPanel
    ├─ Filename
    └─ TagList
        └─ TagItem[]
```

### 组件说明

#### 1. Sidebar
- 功能：导航 + 标签筛选
- Props：
```ts
interface SidebarProps {
  navItems: { id: string; label: string; active: boolean }[];
  tags: { id: string; name: string; selected: boolean }[];
  onTagClick: (tagId: string) => void;
  onNavClick: (navId: string) => void;
}
```
- 交互：
  - 点击导航或标签更新 Main 显示内容

#### 2. MediaCard
- 功能：展示单个媒体，Hover 显示播放按钮
- Props：

```ts
interface MediaCardProps {
  id: string;
  thumbnail: string;
  filename: string;
  tags: string[];
  selected: boolean;
  onClick: (id: string) => void;
}
```

- 交互：
  - Hover 显示播放图标
  - Click 选中，Inspector 展示内容

#### 3. MediaGrid
- 功能：媒体卡片栅格布局
- Props：
```ts
interface MediaGridProps {
  mediaList: MediaCardProps[];
  onCardClick: (id: string) => void;
  viewMode: 'grid' | 'list';
}
```

#### 4. Inspector
- 功能：显示选中媒体详情
- Props：
```ts
interface InspectorProps {
  media: MediaCardProps | null;
  onTagChange: (tagId: string, action: 'add' | 'remove') => void;
}
```

#### 5. Toolbar
- 功能：显示标签过滤状态 + Grid/List 切换
- Props：
```ts
interface ToolbarProps {
  activeTags: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}
```

#### 6. TagItem
- 功能：可复用标签组件
- Props：
```ts
interface TagItemProps {
  name: string;
  selected: boolean;
  onClick: () => void;
}
```
---

## 5️⃣ 技术架构
- 前端：React + TypeScript + TailwindCSS
- 桌面应用：Tauri V2
- 状态管理：React Context（可升级为 Zustand）
- 媒体数据：后续接入 SQLite 或 JSON 存储

---

## 6️⃣ 里程碑规划（V0）

| 里程碑 | 目标 | 时间 | 交付物 |
|--------|------|------|--------|
| 1 | 项目骨架搭建 | 2–3 天 | 可运行的 Tauri + React 项目，三栏布局占位 |
| 2 | 核心组件开发 | 3–4 天 | Sidebar、MediaCard、MediaGrid、Inspector、Toolbar 组件占位可用 |
| 3 | 交互逻辑实现 | 2–3 天 | Sidebar 标签筛选、MediaCard 点击 Inspector、Inspector 标签编辑 |
| 4 | 样式优化 | 2 天 | 高保真暗黑主题，MediaCard hover，Inspector/Sidebar 样式完善 |
| 5 | 测试与微调 | 1–2 天 | 组件交互测试、布局微调、Bug 修复 |

---

## 7️⃣ 下一步计划（V1）
- 完整 MediaCard 播放功能
- Grid/List 布局切换
- 搜索和快速筛选
- 拖拽排序 MediaCard
- 本地数据库存储媒体信息和标签

---

## 8️⃣ 参考文档
- [Tauri 官方文档](https://tauri.app/)
- [React 官方文档](https://react.dev/)
- [TailwindCSS 官方文档](https://tailwindcss.com/)

---