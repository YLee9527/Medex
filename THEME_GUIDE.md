# 主题系统使用指南

## 概述

Medex 应用现在支持深色和浅色两种主题。主题系统通过 React Context 实现，所有组件都可以通过主题变量来访问颜色配置。

## 主题结构

### 主题配置文件
- **位置**: `src/theme/theme.ts`
- **内容**: 
  - `ThemeColors` 接口定义所有颜色变量
  - `darkTheme` 深色主题配置（原始设计）
  - `lightTheme` 浅色主题配置（自动生成）

### 主题 Context
- **位置**: `src/contexts/ThemeContext.tsx`
- **提供**:
  - `theme`: 当前主题的颜色对象
  - `themeMode`: 当前主题模式 ('dark' | 'light')
  - `isDark`: 是否为深色主题
  - `toggleTheme`: 切换主题函数
  - `setTheme`: 设置主题函数

## 颜色变量说明

```typescript
interface ThemeColors {
  // 基础背景色
  background: string;      // 主背景
  sidebar: string;         // 侧边栏背景
  main: string;            // 主内容区背景
  inspector: string;       // 检查器背景
  
  // 文本颜色
  text: string;            // 主文本
  textSecondary: string;   // 次要文本
  textTertiary: string;    // 第三级文本
  
  // 边框颜色
  border: string;          // 主边框
  borderLight: string;     // 浅色边框
  
  // 交互色
  hover: string;           // 悬停背景
  active: string;          // 激活状态背景
  selected: string;        // 选中状态背景
  
  // 输入框
  inputBg: string;         // 输入框背景
  inputBorder: string;     // 输入框边框
  inputFocusBorder: string;// 输入框聚焦边框
  
  // 标签
  tagBg: string;           // 标签背景
  tagHover: string;        // 标签悬停
  
  // 按钮
  buttonBg: string;        // 按钮背景
  buttonHover: string;     // 按钮悬停
  
  // 遮罩层
  overlay: string;         // 遮罩层背景
  
  // 功能色
  favorite: string;        // 收藏星标颜色
  highlight: string;       // 高亮颜色
}
```

## 使用方式

### 1. 在组件中使用主题

```tsx
import { useThemeContext } from '../contexts/ThemeContext';

export default function MyComponent() {
  const { theme, themeMode } = useThemeContext();
  
  return (
    <div 
      style={{ 
        backgroundColor: theme.sidebar,
        color: theme.text,
        borderColor: theme.borderLight
      }}
    >
      {/* 组件内容 */}
    </div>
  );
}
```

### 2. 在 Container 组件中传递主题

```tsx
import { useThemeContext } from '../contexts/ThemeContext';

export default function MyContainer() {
  const { theme } = useThemeContext();
  
  return (
    <MyComponent theme={theme} />
  );
}
```

### 3. 组件 Props 接口

```tsx
import { ThemeColors } from '../theme/theme';

interface MyComponentProps {
  // ... 其他 props
  theme: ThemeColors;
}

export default function MyComponent({ theme }: MyComponentProps) {
  return (
    <div style={{ backgroundColor: theme.background }}>
      {/* 组件内容 */}
    </div>
  );
}
```

## 已更新的组件

- ✅ Sidebar - 侧边栏（包含主题切换按钮）
- ✅ TagItem - 标签项
- ✅ Toolbar - 工具栏
- ✅ ToolbarContainer - 工具栏容器

## 待更新的组件

以下组件需要迁移到主题系统：

1. **MediaCard** (`src/components/MediaCard.tsx`)
   - 卡片背景：`#242424` → `theme.cardBg` (需添加)
   - 文本颜色：`#EAEAEA` → `theme.text`
   - 标签背景：`rgba(255, 255, 255, 0.10)` → `theme.tagBg`

2. **MediaGrid** (`src/components/MediaGrid.tsx`)
   - 表头背景：`#101010` → `theme.background`
   - 行背景：`#242424` → `theme.rowBg` (需添加)

3. **Inspector** (`src/components/Inspector.tsx`)
   - 所有硬编码颜色需要替换为主题变量

4. **MediaViewer** (`src/components/MediaViewer.tsx`)
   - 背景遮罩颜色
   - 控制按钮颜色

5. **Settings** (`src/pages/Settings.tsx`)
   - 所有硬编码颜色需要替换

6. **UpdatePage** (`src/pages/UpdatePage.tsx`)
   - 所有硬编码颜色需要替换

## 添加新的颜色变量

如果需要添加新的颜色变量（如 `cardBg`、`rowBg` 等），请更新：

1. `src/theme/theme.ts` - 在 `ThemeColors` 接口中添加属性
2. `src/theme/theme.ts` - 在 `darkTheme` 和 `generateLightTheme` 函数中添加对应的值

```typescript
export interface ThemeColors {
  // ... 现有属性
  cardBg: string;        // 卡片背景
  rowBg: string;         // 列表行背景
}

export const darkTheme: ThemeColors = {
  // ... 现有属性
  cardBg: '#242424',
  rowBg: '#242424',
  // ...
}
```

## 主题切换

用户可以通过侧边栏底部的按钮切换主题。主题选择会保存在 `localStorage` 中，下次打开应用时会自动应用上次的主题设置。

## 注意事项

1. 避免在组件中直接使用硬编码的颜色值（如 `#242424`、`bg-[#242424]`）
2. 优先使用 `style` 属性来应用主题颜色，以便动态切换
3. 对于 Tailwind 工具类，可以保留布局类（如 `p-4`、`flex`），但颜色相关的应使用主题变量
4. 悬停效果可以通过 `onMouseEnter`/`onMouseLeave` 事件配合 `style` 实现
