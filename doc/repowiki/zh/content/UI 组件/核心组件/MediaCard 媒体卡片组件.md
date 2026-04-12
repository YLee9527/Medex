# MediaCard 媒体卡片组件

<cite>
**本文档引用的文件**
- [MediaCard.tsx](file://src/components/MediaCard.tsx)
- [MediaCardContextMenu.tsx](file://src/components/MediaCardContextMenu.tsx)
- [MediaGrid.tsx](file://src/components/MediaGrid.tsx)
- [MediaGridContainer.tsx](file://src/containers/MediaGridContainer.tsx)
- [ThemeContext.tsx](file://src/contexts/ThemeContext.tsx)
- [I18nContext.tsx](file://src/contexts/I18nContext.tsx)
- [theme.ts](file://src/theme/theme.ts)
- [useAppStore.ts](file://src/store/useAppStore.ts)
- [en-US.json](file://src/i18n/en-US.json)
- [zh-CN.json](file://src/i18n/zh-CN.json)
- [tags.rs](file://src-tauri/src/services/tags.rs)
- [tailwind.config.ts](file://tailwind.config.ts)
- [main.tsx](file://src/main.tsx)
- [App.tsx](file://src/App.tsx)
- [Settings.tsx](file://src/pages/Settings.tsx)
- [index.css](file://src/index.css)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

MediaCard 是 Medex 媒体管理应用中的核心媒体展示组件，负责以卡片形式呈现媒体文件的预览、元数据和交互功能。该组件实现了完整的媒体浏览体验，包括图片和视频预览、标签管理、收藏功能、右键菜单以及响应式布局。

组件采用现代化的设计理念，支持深色/浅色主题切换，提供流畅的动画过渡效果，并通过 Tauri 命令与后端服务进行数据交互。整体设计注重用户体验和性能优化，特别是在大量媒体内容的场景下保持良好的渲染性能。

**更新** 新增媒体显示自定义功能，允许用户通过 `showName` 和 `showTags` 属性控制媒体卡片的显示内容。同时新增媒体网格重置滚动功能，当筛选条件变化时自动重置滚动位置，提升用户体验。

**更新** 新增国际化系统集成，提供中英文双语界面支持，增强全球用户的使用体验。组件通过 I18nContext 实现动态语言切换和本地化文本显示。

## 项目结构

MediaCard 组件位于前端组件目录中，与相关的上下文、容器和主题系统紧密集成：

```mermaid
graph TB
subgraph "组件层"
MediaCard[MediaCard.tsx]
MediaCardContextMenu[MediaCardContextMenu.tsx]
MediaGrid[MediaGrid.tsx]
end
subgraph "容器层"
MediaGridContainer[MediaGridContainer.tsx]
end
subgraph "状态管理层"
useAppStore[useAppStore.ts]
end
subgraph "国际化系统"
I18nContext[I18nContext.tsx]
I18nProvider[I18nProvider]
enUS[en-US.json]
zhCN[zh-CN.json]
Settings[Settings.tsx]
App[App.tsx]
end
subgraph "主题系统"
ThemeContext[ThemeContext.tsx]
theme[theme.ts]
tailwind[Tailwind CSS]
end
subgraph "后端服务"
tagsService[tags.rs]
end
MediaGridContainer --> MediaGrid
MediaGrid --> MediaCard
MediaCardContextMenu --> MediaCard
MediaGridContainer --> useAppStore
MediaCard --> ThemeContext
MediaCard --> I18nContext
I18nProvider --> I18nContext
I18nContext --> enUS
I18nContext --> zhCN
Settings --> I18nProvider
App --> I18nProvider
ThemeContext --> theme
MediaCard --> tagsService
```

**图表来源**
- [MediaCard.tsx:1-5](file://src/components/MediaCard.tsx#L1-L5)
- [MediaGrid.tsx:1-11](file://src/components/MediaGrid.tsx#L1-L11)
- [MediaGridContainer.tsx:1-10](file://src/containers/MediaGridContainer.tsx#L1-L10)
- [I18nContext.tsx:1-51](file://src/contexts/I18nContext.tsx#L1-L51)
- [en-US.json:1-114](file://src/i18n/en-US.json#L1-L114)
- [zh-CN.json:1-114](file://src/i18n/zh-CN.json#L1-L114)
- [main.tsx:7-44](file://src/main.tsx#L7-L44)
- [Settings.tsx:144-171](file://src/pages/Settings.tsx#L144-L171)
- [App.tsx:126-158](file://src/App.tsx#L126-L158)

**章节来源**
- [MediaCard.tsx:1-426](file://src/components/MediaCard.tsx#L1-L426)
- [MediaGrid.tsx:1-385](file://src/components/MediaGrid.tsx#L1-L385)
- [MediaGridContainer.tsx:1-638](file://src/containers/MediaGridContainer.tsx#L1-L638)

## 核心组件

### MediaCard 组件

MediaCard 是媒体卡片的核心组件，提供了完整的媒体展示和交互功能。组件支持多种媒体类型，包括图片和视频，并针对不同类型的媒体提供相应的预览策略。

#### 主要特性

- **多媒体类型支持**：同时支持图片和视频媒体的预览
- **标签管理系统**：内联标签显示和移除功能
- **收藏功能**：一键收藏/取消收藏媒体
- **主题集成**：完全支持深色/浅色主题切换
- **响应式设计**：适配网格和列表两种视图模式
- **性能优化**：使用 memo 和 react-window 进行虚拟化渲染
- **国际化支持**：内置多语言界面支持，通过 I18nContext 实现动态语言切换
- **显示自定义**：支持通过 `showName` 和 `showTags` 属性控制显示内容
- **动态高度调整**：根据显示内容自动调整卡片高度

#### 关键属性

| 属性名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 媒体唯一标识符 |
| path | string | 否 | - | 媒体文件路径 |
| thumbnail | string | 是 | - | 缩略图URL或本地路径 |
| filename | string | 是 | - | 媒体文件名 |
| tags | string[] | 是 | - | 媒体标签数组 |
| time | string | 否 | - | 媒体时间信息 |
| mediaType | string | 否 | - | 媒体类型（image/video） |
| duration | string | 否 | - | 视频时长 |
| resolution | string | 否 | - | 分解率信息 |
| isFavorite | boolean | 否 | false | 收藏状态 |
| selected | boolean | 是 | - | 选中状态 |
| onClick | function | 是 | - | 点击回调函数 |
| onDoubleClick | function | 否 | - | 双击回调函数 |
| onToggleFavorite | function | 否 | - | 收藏状态切换回调 |
| onTagRemoved | function | 否 | - | 标签移除回调 |
| onContextMenu | function | 否 | - | 右键菜单回调 |
| videoThumbnail | string | 否 | - | 视频专用缩略图 |
| className | string | 否 | - | 自定义CSS类名 |
| mode | 'grid' \| 'list' | 否 | 'grid' | 视图模式 |
| theme | ThemeColors | 是 | - | 主题颜色配置 |
| showName | boolean | 否 | true | 是否显示媒体名称 |
| showTags | boolean | 否 | true | 是否显示媒体标签 |

**更新** 新增 `showName` 和 `showTags` 属性，允许用户自定义媒体卡片的显示内容。这两个属性默认为 `true`，表示显示媒体名称和标签。

**章节来源**
- [MediaCard.tsx:7-31](file://src/components/MediaCard.tsx#L7-L31)

### MediaGrid 组件

**更新** MediaGrid 组件现在支持媒体显示自定义功能和滚动重置功能。

MediaGrid 是媒体网格的容器组件，负责管理媒体卡片的布局和渲染。它集成了虚拟化渲染技术，支持大数据集的高效展示。

#### 主要特性

- **虚拟化渲染**：使用 react-window 实现高性能网格和列表渲染
- **响应式布局**：根据容器宽度自动计算网格列数
- **滚动重置**：当筛选条件变化时自动重置滚动位置
- **显示自定义**：支持通过 `showName` 和 `showTags` 属性控制显示内容
- **国际化支持**：内置多语言界面支持

#### 关键属性

| 属性名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| mediaList | MediaCardProps[] | 是 | - | 媒体卡片属性数组 |
| selectedIds | Set<string> | 是 | - | 选中媒体ID集合 |
| onCardClick | function | 是 | - | 卡片点击回调 |
| onCardDoubleClick | function | 是 | - | 卡片双击回调 |
| onToggleFavorite | function | 是 | - | 收藏状态切换回调 |
| onTagAdded | function | 是 | - | 标签添加回调 |
| onTagRemoved | function | 是 | - | 标签移除回调 |
| onCardContextMenu | function | 否 | - | 右键菜单回调 |
| onBackgroundClick | function | 否 | - | 背景点击回调 |
| thumbnails | Record<string, string> | 是 | - | 缩略图映射 |
| onVisibleRangeChange | function | 否 | - | 可见范围变化回调 |
| viewMode | 'grid' \| 'list' | 是 | - | 视图模式 |
| theme | ThemeColors | 是 | - | 主题颜色配置 |
| showName | boolean | 否 | true | 是否显示媒体名称 |
| showTags | boolean | 否 | true | 是否显示媒体标签 |
| resetScrollKey | number | 否 | - | 重置滚动条的key |

**更新** 新增 `showName` 和 `showTags` 属性，支持媒体显示自定义。新增 `resetScrollKey` 属性，用于媒体网格重置滚动功能。

**章节来源**
- [MediaGrid.tsx:16-35](file://src/components/MediaGrid.tsx#L16-L35)

### 国际化系统集成

**更新** MediaCard 组件现在集成了完整的国际化系统，支持中英文双语界面。

组件通过 I18nContext 获取当前语言设置，提供动态的语言切换能力。国际化系统支持：

- **自动语言检测**：根据浏览器语言设置自动选择默认语言
- **本地存储持久化**：用户选择的语言会保存到 localStorage
- **键值映射系统**：通过统一的键值对管理所有界面文本
- **动态语言切换**：运行时支持切换语言而不需刷新页面

#### 国际化键值

组件使用的国际化键值包括：

| 键值 | 中文 | 英文 | 用途 |
|------|------|------|------|
| mediaCard.noPreview | 无预览 | No Preview | 无预览状态显示 |
| mediaCard.generatingThumb | 生成缩略图... | Generating thumbnail... | 视频缩略图生成提示 |
| mediaCard.removeTagFailedPrefix | 移除标签失败： | Remove tag failed: | 标签移除错误前缀 |
| inspector.favorite.add | 收藏 | Favorite | 收藏按钮提示 |
| inspector.favorite.remove | 取消收藏 | Unfavorite | 取消收藏按钮提示 |

#### 国际化实现机制

组件通过以下方式实现国际化：

1. **Hook 使用**：在组件顶部导入并使用 `useI18n()` Hook
2. **翻译函数**：通过 `t()` 函数获取本地化文本
3. **动态更新**：语言切换时自动重新渲染组件
4. **键值映射**：通过 JSON 资源文件管理多语言文本

**章节来源**
- [I18nContext.tsx:1-51](file://src/contexts/I18nContext.tsx#L1-L51)
- [MediaCard.tsx:99](file://src/components/MediaCard.tsx#L99)
- [en-US.json:61-64](file://src/i18n/en-US.json#L61-L64)
- [zh-CN.json:61-64](file://src/i18n/zh-CN.json#L61-L64)

### 主题系统集成

组件通过 ThemeContext 获取主题配置，支持深色和浅色两种主题模式。主题系统提供了丰富的颜色变量，包括背景色、文本色、边框色、交互色等。

#### 主题颜色变量

| 颜色类别 | 变量名 | 用途 |
|----------|--------|------|
| 基础背景 | background, sidebar, main, inspector, card, toolbar | 页面和组件背景色 |
| 文本颜色 | text, textSecondary, textTertiary | 文本显示颜色 |
| 边框颜色 | border, borderLight | 边框和分隔线颜色 |
| 交互色 | hover, active, selected, selectionOverlay | 悬停、激活、选中状态 |
| 输入框 | inputBg, inputBorder, inputFocusBorder | 表单控件样式 |
| 标签 | tagBg, tagHover | 标签组件颜色 |
| 按钮 | buttonBg, buttonHover | 按钮组件颜色 |
| 遮罩层 | overlay | 半透明遮罩效果 |
| 功能色 | favorite, highlight, progress | 特殊功能颜色 |

**章节来源**
- [theme.ts:8-52](file://src/theme/theme.ts#L8-L52)
- [ThemeContext.tsx:17-99](file://src/contexts/ThemeContext.tsx#L17-L99)

## 架构概览

MediaCard 组件在整个应用架构中扮演着关键角色，连接了前端界面、状态管理、国际化系统和后端服务：

```mermaid
sequenceDiagram
participant UI as 用户界面
participant Card as MediaCard
participant I18n as I18nContext
participant Container as MediaGridContainer
participant Store as useAppStore
participant Tauri as Tauri命令
participant Backend as 后端服务
UI->>Card : 用户点击卡片
Card->>I18n : 获取国际化文本
I18n-->>Card : 返回翻译文本
Card->>Container : onClick回调
Container->>Store : 更新选中状态
Store-->>Container : 状态变更通知
Container-->>Card : 重新渲染
UI->>Card : 右键点击
Card->>Container : onContextMenu回调
Container->>Container : 显示上下文菜单
UI->>Card : 点击收藏按钮
Card->>Container : onToggleFavorite回调
Container->>Tauri : 调用set_media_favorite
Tauri->>Backend : 更新数据库
Backend-->>Tauri : 操作结果
Tauri-->>Container : 返回结果
Container->>Store : 更新收藏状态
Store-->>Container : 状态更新
```

**图表来源**
- [MediaCard.tsx:99](file://src/components/MediaCard.tsx#L99)
- [MediaGridContainer.tsx:64-96](file://src/containers/MediaGridContainer.tsx#L64-L96)
- [useAppStore.ts:145-394](file://src/store/useAppStore.ts#L145-L394)

**章节来源**
- [MediaGridContainer.tsx:185-201](file://src/containers/MediaGridContainer.tsx#L185-L201)
- [useAppStore.ts:145-394](file://src/store/useAppStore.ts#L145-L394)

## 详细组件分析

### 收藏按钮样式重新设计

**更新** 收藏按钮样式已重新设计，实现了图标颜色的标准化和视觉一致性改进。

#### 收藏按钮设计规范

收藏按钮现在采用统一的设计规范，确保在不同主题和状态下的一致性：

```mermaid
flowchart TD
Start([收藏按钮渲染]) --> CheckState{"检查收藏状态"}
CheckState --> |已收藏| RenderFullStar["渲染金黄色实心星形"]
CheckState --> |未收藏| RenderEmptyStar["渲染半透明空心星形"]
RenderFullStar --> SetColor["设置颜色为 #F59E0B"]
SetColor --> SetBG["设置背景为 rgba(255, 255, 255, 0.55)"]
SetBG --> HoverEffect["悬停时增加透明度至 0.75"]
RenderEmptyStar --> SetEmptyColor["设置颜色为 rgba(0, 0, 0, 0.65)"]
SetEmptyColor --> SetEmptyBG["设置背景为 rgba(255, 255, 255, 0.55)"]
SetEmptyBG --> HoverEffect
HoverEffect --> End([完成渲染])
```

**图表来源**
- [MediaCard.tsx:153-196](file://src/components/MediaCard.tsx#L153-L196)

#### 设计改进要点

1. **图标颜色标准化**
   - 已收藏状态：使用标准金黄色 `#F59E0B`
   - 未收藏状态：使用半透明黑色 `rgba(0, 0, 0, 0.65)`
   - 确保在浅色和深色主题下都有良好的对比度

2. **背景透明度统一**
   - 所有状态下的背景透明度统一为 `rgba(255, 255, 255, 0.55)`
   - 悬停时增加到 `rgba(255, 255, 255, 0.75)` 提供明确的交互反馈

3. **视觉层次优化**
   - 圆形背景设计，尺寸为 `h-7 w-7`
   - 位置固定在卡片右上角，不影响媒体预览区域
   - z-index 设置为 10，确保按钮始终可见

4. **主题兼容性**
   - 通过 CSS 变量 `var(--medex-favorite)` 支持主题切换
   - 深色主题：`--medex-favorite: #FCD34D`
   - 浅色主题：`--medex-favorite: #F59E0B`

#### 收藏状态切换流程

```mermaid
sequenceDiagram
participant User as 用户
participant Button as 收藏按钮
participant Card as MediaCard
participant Container as MediaGridContainer
User->>Button : 点击收藏按钮
Button->>Card : 触发 onToggleFavorite 回调
Card->>Container : 传递媒体ID
Container->>Container : 切换收藏状态
Container->>Container : 更新本地状态
Container->>Container : 调用 Tauri 命令
Container->>Container : 同步到数据库
Container->>Card : 重新渲染
Card->>Button : 更新按钮状态
```

**图表来源**
- [MediaCard.tsx:150-152](file://src/components/MediaCard.tsx#L150-L152)
- [MediaGridContainer.tsx:190-206](file://src/containers/MediaGridContainer.tsx#L190-L206)

**章节来源**
- [MediaCard.tsx:153-196](file://src/components/MediaCard.tsx#L153-L196)
- [theme.ts:49](file://src/theme/theme.ts#L49)
- [index.css:52](file://src/index.css#L52)
- [index.css:102](file://src/index.css#L102)

### 标签移除功能实现

**更新** 标签移除功能现在包含了改进的错误处理机制，提供更好的用户反馈。

标签移除是 MediaCard 组件中最复杂的交互功能之一，涉及前后端的数据同步和状态管理：

```mermaid
flowchart TD
Start([用户点击标签]) --> Validate["验证标签有效性"]
Validate --> CheckId{"媒体ID有效?"}
CheckId --> |否| ReturnError["返回错误"]
CheckId --> |是| FetchTags["调用get_tags_by_media获取标签"]
FetchTags --> MatchTag{"找到匹配标签?"}
MatchTag --> |否| SkipOperation["跳过操作"]
MatchTag --> |是| RemoveTag["调用remove_tag_from_media"]
RemoveTag --> UpdateLocal["更新本地状态"]
UpdateLocal --> DispatchEvents["派发全局事件"]
DispatchEvents --> Success["操作成功"]
SkipOperation --> Success
ReturnError --> ErrorHandling["错误处理"]
ErrorHandling --> LogError["记录错误日志"]
LogError --> ShowAlert["显示用户友好的错误提示"]
ShowAlert --> End([结束])
Success --> End
```

**图表来源**
- [MediaCard.tsx:73-97](file://src/components/MediaCard.tsx#L73-L97)
- [MediaGridContainer.tsx:150-180](file://src/containers/MediaGridContainer.tsx#L150-L180)

#### 标签移除流程详解

1. **参数验证**：首先验证媒体ID的有效性，确保转换为有效的数字格式
2. **标签查询**：通过 Tauri 命令 `get_tags_by_media` 查询媒体的所有标签
3. **匹配验证**：在返回的标签列表中查找目标标签，确保操作的安全性
4. **数据库操作**：调用 `remove_tag_from_media` 命令从数据库中移除标签关联
5. **状态更新**：更新本地状态管理器中的媒体标签信息
6. **事件通知**：派发全局事件通知其他组件进行相应更新
7. **错误处理**：捕获并处理任何操作失败的情况，提供用户友好的错误提示

#### 改进的错误处理机制

**更新** 新增了完善的错误处理和用户反馈机制：

- **错误日志记录**：使用 `console.error` 记录详细的错误信息
- **国际化错误提示**：通过 `t()` 函数获取本地化的错误消息
- **用户友好提示**：使用 `window.alert` 提供清晰的错误反馈
- **操作回滚保护**：在失败情况下不会破坏现有状态

#### Tauri 命令调用过程

标签移除功能通过以下 Tauri 命令与后端服务交互：

| 命令名称 | 参数 | 返回值 | 用途 |
|----------|------|--------|------|
| get_tags_by_media | media_id: i64 | Vec<Tag> | 获取媒体的所有标签 |
| remove_tag_from_media | media_id: i64, tag_id: i64 | Result<(), String> | 移除媒体标签关联 |

**章节来源**
- [MediaCard.tsx:73-97](file://src/components/MediaCard.tsx#L73-L97)
- [tags.rs:167-188](file://src-tauri/src/services/tags.rs#L167-L188)

### 图片加载失败处理机制

组件实现了完善的图片加载失败处理机制，确保在各种网络和文件系统条件下都能提供良好的用户体验：

```mermaid
flowchart TD
LoadImage[开始加载图片] --> CheckType{"媒体类型?"}
CheckType --> |图片| LoadSuccess[图片加载成功]
CheckType --> |视频| CheckThumb{有视频缩略图?}
CheckType --> |无预览| ShowPlaceholder[显示占位符]
LoadSuccess --> ImageLoaded[图片显示]
CheckThumb --> |有| ShowVideoThumb[显示视频缩略图]
CheckThumb --> |无| ShowGenerating[显示生成中状态]
ImageLoaded --> End([完成])
ShowVideoThumb --> End
ShowGenerating --> End
ShowPlaceholder --> End
```

**图表来源**
- [MediaCard.tsx:225-244](file://src/components/MediaCard.tsx#L225-L244)
- [MediaCard.tsx:210-223](file://src/components/MediaCard.tsx#L210-L223)

#### 图片加载策略

1. **远程资源处理**：对于 http/https/asset 协议的资源直接使用
2. **本地文件处理**：对绝对路径使用 Tauri 的 convertFileSrc 转换
3. **错误处理**：通过 onError 回调检测加载失败并切换到备用显示方案
4. **懒加载优化**：使用 loading="lazy" 和 decoding="async" 提升性能

**章节来源**
- [MediaCard.tsx:225-244](file://src/components/MediaCard.tsx#L225-L244)
- [MediaCard.tsx:368-380](file://src/components/MediaCard.tsx#L368-L380)

### 右键菜单系统

MediaCard 组件集成了完整的右键菜单系统，提供丰富的上下文操作：

```mermaid
classDiagram
class MediaCardContextMenu {
+boolean visible
+number x
+number y
+string mediaId
+string[] mediaTags
+Tag[] allTags
+number selectedCount
+string[] commonTags
+function onClose
+function onTagsApplied
-string[] selectedTags
-string searchQuery
-object adjustedPosition
-boolean isClosing
+toggleTag(tagName)
+applyTagChanges(added, removed)
+closeAndSubmit()
}
class Tag {
+number id
+string name
}
MediaCardContextMenu --> Tag : uses
MediaCardContextMenu --> MediaCard : triggers
```

**图表来源**
- [MediaCardContextMenu.tsx:10-21](file://src/components/MediaCardContextMenu.tsx#L10-L21)
- [MediaCardContextMenu.tsx:5-8](file://src/components/MediaCardContextMenu.tsx#L5-L8)

#### 上下文菜单功能

- **标签管理**：支持添加、移除和搜索标签
- **批量操作**：支持对多个媒体同时应用标签
- **智能定位**：自动调整菜单位置避免超出屏幕边界
- **键盘导航**：支持 Esc 键快速关闭菜单
- **国际化界面**：所有菜单项都支持多语言显示

**章节来源**
- [MediaCardContextMenu.tsx:23-51](file://src/components/MediaCardContextMenu.tsx#L23-L51)
- [MediaCardContextMenu.tsx:188](file://src/components/MediaCardContextMenu.tsx#L188)

### 媒体显示自定义功能

**更新** 新增媒体显示自定义功能，允许用户控制媒体卡片的显示内容。

MediaCard 组件现在支持通过 `showName` 和 `showTags` 属性自定义显示内容，提供更灵活的媒体展示方式。

#### 显示控制机制

```mermaid
flowchart TD
Start([渲染媒体卡片]) --> CheckShowName{"showName为true?"}
CheckShowName --> |是| ShowName["显示媒体名称"]
CheckShowName --> |否| HideName["隐藏媒体名称"]
ShowName --> CheckShowTags{"showTags为true?"}
HideName --> CheckShowTags
CheckShowTags --> |是| ShowTags["显示媒体标签"]
CheckShowTags --> |否| HideTags["隐藏媒体标签"]
ShowTags --> AdjustHeight["调整卡片高度"]
HideTags --> AdjustHeight
AdjustHeight --> End([完成渲染])
```

**图表来源**
- [MediaCard.tsx:277-362](file://src/components/MediaCard.tsx#L277-L362)

#### 动态高度调整

组件根据显示内容自动调整卡片高度，确保布局的紧凑性和美观性：

1. **网格视图高度**：
   - 显示名称和标签：150px
   - 显示名称或标签：180px
   - 隐藏所有内容：220px

2. **信息区域高度**：
   - 显示名称和标签：70px
   - 显示名称或标签：40px
   - 隐藏所有内容：自适应

3. **最小高度控制**：确保在不同显示组合下都有合适的最小高度

**章节来源**
- [MediaCard.tsx:141-145](file://src/components/MediaCard.tsx#L141-L145)
- [MediaCard.tsx:271-276](file://src/components/MediaCard.tsx#L271-L276)

### 媒体网格重置滚动功能

**更新** 新增媒体网格重置滚动功能，提升用户体验。

当筛选条件（媒体类型或标签）发生变化时，MediaGrid 组件会自动重置滚动位置到顶部，确保用户看到新的结果集的开头。

#### 滚动重置机制

```mermaid
sequenceDiagram
participant User as 用户
participant Filter as 筛选条件
participant Container as MediaGridContainer
participant Grid as MediaGrid
User->>Filter : 更改筛选条件
Filter->>Container : 触发筛选变化
Container->>Container : setResetScrollKey递增
Container->>Grid : 传递resetScrollKey
Grid->>Grid : useEffect监听resetScrollKey
Grid->>Grid : scrollTo({scrollTop : 0})
Grid-->>User : 滚动到顶部
```

**图表来源**
- [MediaGridContainer.tsx:256-259](file://src/containers/MediaGridContainer.tsx#L256-L259)
- [MediaGrid.tsx:109-114](file://src/components/MediaGrid.tsx#L109-L114)

#### 实现细节

1. **状态管理**：在 MediaGridContainer 中维护 `resetScrollKey` 状态
2. **条件监听**：监听筛选条件的变化（selectedTagKey 和 mediaTypeFilter）
3. **自动递增**：每次筛选条件变化时递增 `resetScrollKey`
4. **滚动重置**：通过 useEffect 监听 `resetScrollKey` 变化并重置滚动位置

**章节来源**
- [MediaGridContainer.tsx:48](file://src/containers/MediaGridContainer.tsx#L48)
- [MediaGridContainer.tsx:256-259](file://src/containers/MediaGridContainer.tsx#L256-L259)
- [MediaGrid.tsx:109-114](file://src/components/MediaGrid.tsx#L109-L114)

### 设置页面集成

**更新** Settings 页面集成了媒体显示自定义功能的用户界面。

Settings 组件提供了用户友好的界面来控制媒体卡片的显示设置，包括媒体名称和标签的显示开关。

#### 设置项功能

1. **显示媒体名称**：控制是否在媒体卡片中显示文件名
2. **显示媒体标签**：控制是否在媒体卡片中显示标签
3. **状态持久化**：通过 localStorage 保存用户的选择
4. **实时更新**：更改设置后立即影响媒体网格的显示

**章节来源**
- [Settings.tsx:509-581](file://src/pages/Settings.tsx#L509-L581)

## 依赖关系分析

MediaCard 组件的依赖关系体现了清晰的分层架构：

```mermaid
graph TB
subgraph "外部依赖"
React[React]
Tauri[Tauri API]
Tailwind[Tailwind CSS]
end
subgraph "内部模块"
MediaCard[MediaCard]
MediaGrid[MediaGrid]
MediaGridContainer[MediaGridContainer]
ThemeContext[ThemeContext]
I18nContext[I18nContext]
useAppStore[useAppStore]
tagsService[tags.rs]
enUS[en-US.json]
zhCN[zh-CN.json]
I18nProvider[I18nProvider]
Settings[Settings.tsx]
App[App.tsx]
end
React --> MediaCard
Tauri --> MediaCard
Tailwind --> MediaCard
MediaGridContainer --> MediaGrid
MediaGrid --> MediaCard
MediaCard --> ThemeContext
MediaCard --> I18nContext
I18nProvider --> I18nContext
MediaGridContainer --> useAppStore
MediaCard --> tagsService
ThemeContext --> useAppStore
I18nContext --> enUS
I18nContext --> zhCN
Settings --> I18nProvider
App --> I18nProvider
```

**图表来源**
- [MediaCard.tsx:1-5](file://src/components/MediaCard.tsx#L1-L5)
- [MediaGrid.tsx:1-11](file://src/components/MediaGrid.tsx#L1-L11)
- [MediaGridContainer.tsx:1-10](file://src/containers/MediaGridContainer.tsx#L1-L10)
- [I18nContext.tsx:1-51](file://src/contexts/I18nContext.tsx#L1-L51)
- [main.tsx:7-44](file://src/main.tsx#L7-L44)

### 组件间通信

组件间的通信主要通过 props 传递和事件回调实现：

1. **父组件到子组件**：通过 props 传递媒体数据和回调函数
2. **子组件到父组件**：通过回调函数向上级传递用户交互事件
3. **状态管理**：通过 useAppStore 进行全局状态同步
4. **主题传递**：通过 ThemeContext 在组件树中传递主题配置
5. **国际化传递**：通过 I18nContext 提供多语言支持
6. **显示设置传递**：通过 props 传递 `showName` 和 `showTags` 设置

**章节来源**
- [MediaGrid.tsx:253-271](file://src/components/MediaGrid.tsx#L253-L271)
- [MediaGridContainer.tsx:605-622](file://src/containers/MediaGridContainer.tsx#L605-L622)

## 性能考虑

### Memo 优化机制

MediaCard 组件采用了深度比较的 memo 优化策略，通过自定义比较函数避免不必要的重渲染：

#### 比较逻辑分析

```mermaid
flowchart TD
CompareProps[比较属性] --> CheckBasic["检查基础属性"]
CheckBasic --> BasicChanged{"基础属性变化?"}
BasicChanged --> |是| NeedReRender[需要重新渲染]
BasicChanged --> |否| CheckCallbacks["检查回调函数"]
CheckCallbacks --> CallbackChanged{"回调函数变化?"}
CallbackChanged --> |是| NeedReRender
CallbackChanged --> |否| CheckTags["检查标签数组"]
CheckTags --> TagsChanged{"标签数组变化?"}
TagsChanged --> |是| NeedReRender
TagsChanged --> |否| CheckTheme["检查主题对象"]
CheckTheme --> ThemeChanged{"主题对象变化?"}
ThemeChanged --> |是| NeedReRender
ThemeChanged --> |否| CheckI18n["检查国际化状态"]
CheckI18n --> I18nChanged{"国际化状态变化?"}
I18nChanged --> |是| NeedReRender
I18nChanged --> |否| CheckDisplay["检查显示设置"]
CheckDisplay --> DisplayChanged{"显示设置变化?"}
DisplayChanged --> |是| NeedReRender
DisplayChanged --> |否| SkipRender[跳过渲染]
NeedReRender --> End([结束])
SkipRender --> End
```

**图表来源**
- [MediaCard.tsx:382-425](file://src/components/MediaCard.tsx#L382-L425)

#### 优化效果

1. **属性缓存**：基础属性变化才会触发重新渲染
2. **回调函数稳定性**：避免因回调函数重新创建导致的重渲染
3. **标签数组优化**：逐个比较标签内容而非整个数组引用
4. **主题对象比较**：确保主题切换时正确触发重渲染
5. **国际化状态优化**：国际化状态变化时正确触发重渲染
6. **显示设置优化**：`showName` 和 `showTags` 属性变化时正确触发重渲染

**章节来源**
- [MediaCard.tsx:382-425](file://src/components/MediaCard.tsx#L382-L425)

### 虚拟化渲染

MediaGridContainer 结合 react-window 实现了高效的虚拟化渲染：

- **FixedSizeGrid**：用于网格视图的高性能网格渲染
- **FixedSizeList**：用于列表视图的高性能列表渲染
- **可视区域计算**：智能计算可见和预加载区域
- **内存优化**：只渲染当前可视区域内的组件

**章节来源**
- [MediaGrid.tsx:146-212](file://src/components/MediaGrid.tsx#L146-L212)
- [MediaGrid.tsx:417-451](file://src/components/MediaGrid.tsx#L417-L451)

### 图片预加载策略

组件实现了智能的图片预加载机制：

1. **延迟加载**：使用 `loading="lazy"` 减少初始加载压力
2. **优先级队列**：视频缩略图按优先级顺序加载
3. **并发控制**：限制同时进行的预加载任务数量
4. **队列管理**：使用任务队列避免过度请求

**章节来源**
- [MediaGridContainer.tsx:352-451](file://src/containers/MediaGridContainer.tsx#L352-L451)

### 显示自定义性能优化

**更新** 新增显示自定义功能的性能优化。

媒体显示自定义功能通过以下方式优化性能：

1. **条件渲染**：使用 `showName` 和 `showTags` 控制 JSX 元素的渲染
2. **动态高度计算**：根据显示内容动态计算卡片高度，避免不必要的重排
3. **样式复用**：通过 CSS 类名和内联样式的合理使用减少样式计算
4. **主题变量**：使用 CSS 变量支持主题切换而无需重新计算样式

**章节来源**
- [MediaCard.tsx:277-362](file://src/components/MediaCard.tsx#L277-L362)

## 故障排除指南

### 常见问题及解决方案

#### 标签移除失败

**更新** 标签移除功能现在包含改进的错误处理机制。

**问题现象**：点击标签删除按钮无反应或出现错误提示

**可能原因**：
1. 媒体ID格式不正确
2. 数据库中不存在对应的标签关联
3. Tauri 命令调用失败
4. 国际化资源加载失败

**解决步骤**：
1. 检查媒体ID是否为有效的数字格式
2. 确认标签确实存在于媒体关联中
3. 查看浏览器控制台的错误日志
4. 验证 Tauri 命令权限配置
5. 检查国际化文件是否正确加载
6. 确认网络连接正常

**章节来源**
- [MediaCard.tsx:73-97](file://src/components/MediaCard.tsx#L73-L97)

#### 图片加载失败

**问题现象**：媒体卡片显示为占位符而非实际图片

**可能原因**：
1. 文件路径无效或不存在
2. 网络连接问题
3. 权限不足访问本地文件

**解决步骤**：
1. 验证文件路径格式（本地文件需要 convertFileSrc 转换）
2. 检查网络连接和防火墙设置
3. 确认应用具有访问文件系统的权限
4. 尝试重新生成缩略图

**章节来源**
- [MediaCard.tsx:225-244](file://src/components/MediaCard.tsx#L225-L244)
- [MediaCard.tsx:368-380](file://src/components/MediaCard.tsx#L368-L380)

#### 收藏功能异常

**问题现象**：收藏按钮点击无效或状态不更新

**可能原因**：
1. Tauri 命令 `set_media_favorite` 调用失败
2. 数据库连接问题
3. 状态同步延迟

**解决步骤**：
1. 检查 Tauri 命令执行结果
2. 验证数据库连接状态
3. 强制刷新页面确认状态更新
4. 查看控制台错误日志

**章节来源**
- [MediaGridContainer.tsx:190-206](file://src/containers/MediaGridContainer.tsx#L190-L206)

#### 收藏按钮样式问题

**更新** 新增收藏按钮样式相关的问题排查。

**问题现象**：收藏按钮颜色不正确或视觉不一致

**可能原因**：
1. CSS 变量未正确应用
2. 主题切换时样式未更新
3. 图标颜色与背景对比度不足
4. 悬停效果未正确触发

**解决步骤**：
1. 检查 CSS 变量 `--medex-favorite` 是否正确设置
2. 验证主题切换逻辑是否正常工作
3. 确认图标颜色与背景透明度的组合
4. 测试悬停状态的 JavaScript 事件绑定
5. 检查 Tailwind CSS 类名是否正确应用

**章节来源**
- [MediaCard.tsx:153-196](file://src/components/MediaCard.tsx#L153-L196)
- [index.css:52](file://src/index.css#L52)
- [index.css:102](file://src/index.css#L102)

#### 媒体显示自定义功能异常

**更新** 新增媒体显示自定义功能的问题排查。

**问题现象**：`showName` 或 `showTags` 属性设置无效

**可能原因**：
1. 属性传递错误
2. 状态管理问题
3. 组件重新渲染问题
4. CSS 样式冲突

**解决步骤**：
1. 检查属性是否正确传递到 MediaCard 组件
2. 验证 useAppStore 中的状态值
3. 确认组件重新渲染逻辑
4. 检查 CSS 类名和内联样式的优先级
5. 使用浏览器开发者工具检查元素的实际样式

**章节来源**
- [MediaCard.tsx:277-362](file://src/components/MediaCard.tsx#L277-L362)
- [MediaGridContainer.tsx:619-621](file://src/containers/MediaGridContainer.tsx#L619-L621)

#### 媒体网格滚动重置问题

**更新** 新增媒体网格滚动重置功能的问题排查。

**问题现象**：筛选条件变化时滚动位置未重置

**可能原因**：
1. `resetScrollKey` 状态未正确更新
2. useEffect 依赖项配置错误
3. MediaGrid 组件未正确接收 resetScrollKey
4. 滚动重置逻辑错误

**解决步骤**：
1. 检查 MediaGridContainer 中 resetScrollKey 的递增逻辑
2. 验证 useEffect 的依赖项数组
3. 确认 MediaGrid 组件正确接收和使用 resetScrollKey
4. 检查 scrollTo 方法的调用时机
5. 使用浏览器开发者工具调试状态变化

**章节来源**
- [MediaGridContainer.tsx:256-259](file://src/containers/MediaGridContainer.tsx#L256-L259)
- [MediaGrid.tsx:109-114](file://src/components/MediaGrid.tsx#L109-L114)

#### 国际化显示问题

**更新** 新增国际化相关的问题排查。

**问题现象**：界面文本显示为键值而非翻译内容

**可能原因**：
1. 国际化资源文件加载失败
2. 语言设置未正确保存
3. 键值拼写错误

**解决步骤**：
1. 检查 en-US.json 和 zh-CN.json 文件是否正确加载
2. 验证 localStorage 中的语言设置
3. 确认使用的键值在两个语言文件中都存在
4. 清除浏览器缓存后重试

**章节来源**
- [I18nContext.tsx:22-38](file://src/contexts/I18nContext.tsx#L22-L38)
- [en-US.json:61-64](file://src/i18n/en-US.json#L61-L64)
- [zh-CN.json:61-64](file://src/i18n/zh-CN.json#L61-L64)

### 调试技巧

1. **启用开发模式**：在开发环境中查看详细的错误日志
2. **使用 React DevTools**：监控组件的渲染次数和性能指标
3. **检查网络请求**：确认 Tauri 命令的网络通信正常
4. **验证主题配置**：确保 CSS 变量正确传递到组件
5. **国际化调试**：使用浏览器开发者工具检查 i18n 资源加载状态
6. **收藏按钮调试**：使用浏览器开发者工具检查样式和事件绑定
7. **显示自定义调试**：使用浏览器开发者工具检查条件渲染和样式应用
8. **滚动重置调试**：使用浏览器开发者工具检查状态变化和滚动重置逻辑

## 结论

MediaCard 媒体卡片组件是一个功能完整、性能优化的高质量组件。它成功地将复杂的媒体展示需求转化为简洁易用的用户界面，同时保持了优秀的性能表现。

**更新** 组件现已集成国际化功能，支持中英文双语界面，大大提升了全球用户的使用体验。最新的收藏按钮样式重新设计实现了图标颜色的标准化和视觉一致性改进，为用户提供了更加统一和专业的视觉体验。

**更新** 新增的媒体显示自定义功能和媒体网格重置滚动功能进一步增强了组件的灵活性和用户体验。用户现在可以根据个人偏好控制媒体卡片的显示内容，并在筛选条件变化时获得更好的浏览体验。

组件的主要优势包括：

1. **完整的功能覆盖**：从基本的媒体预览到高级的标签管理
2. **优秀的性能优化**：通过 memo、虚拟化渲染和智能预加载提升性能
3. **灵活的显示控制**：支持通过 `showName` 和 `showTags` 属性自定义显示内容
4. **智能的滚动管理**：当筛选条件变化时自动重置滚动位置
5. **完善的国际化支持**：内置多语言界面，支持全球化部署
6. **统一的视觉设计**：收藏按钮样式标准化，提升视觉一致性
7. **健壮的错误处理**：完善的错误捕获和用户反馈机制
8. **清晰的架构设计**：模块化设计便于维护和扩展

在未来的发展中，可以考虑进一步优化的方向包括：

- 增加更多媒体类型的支持
- 实现更智能的缓存策略
- 提供更多的自定义选项
- 优化移动端的触摸交互体验
- 扩展国际化支持的语言种类
- 进一步优化收藏按钮的交互反馈
- 增强媒体显示自定义功能的配置选项

## 附录

### 使用示例

#### 基本用法

```typescript
// 在 MediaGridContainer 中使用
<MediaCard
  id={mediaItem.id}
  path={mediaItem.path}
  thumbnail={mediaItem.thumbnail}
  filename={mediaItem.filename}
  tags={mediaItem.tags}
  mediaType={mediaItem.mediaType}
  isFavorite={mediaItem.isFavorite}
  selected={selectedIds.has(mediaItem.id)}
  onClick={(e, id) => handleCardClick(e, id, index)}
  onDoubleClick={onOpenViewer}
  onToggleFavorite={handleToggleFavorite}
  onTagRemoved={handleTagRemoved}
  onContextMenu={handleContextMenu}
  videoThumbnail={thumbnails[mediaItem.path]}
  className="w-[180px]"
  mode="grid"
  theme={theme}
  showName={showMediaName}
  showTags={showMediaTags}
/>
```

#### 媒体显示自定义配置

**更新** 新增媒体显示自定义配置示例。

```typescript
// 在 Settings 页面中配置显示设置
const [showMediaName, setShowMediaName] = useState<boolean>(true);
const [showMediaTags, setShowMediaTags] = useState<boolean>(true);

// 通过 useAppStore 管理状态
const showMediaName = useAppStore((state) => state.showMediaName);
const showMediaTags = useAppStore((state) => state.showMediaTags);

// 设置显示自定义
<MediaGrid
  mediaList={mediaList}
  selectedIds={selectedIds}
  onCardClick={handleCardClick}
  onCardDoubleClick={onOpenViewer}
  onToggleFavorite={handleToggleFavorite}
  onTagAdded={addTagToMediaLocal}
  onTagRemoved={removeTagFromMediaLocal}
  onCardContextMenu={handleContextMenu}
  onBackgroundClick={handleBackgroundClick}
  thumbnails={thumbnails}
  onVisibleRangeChange={handleVisibleRangeChange}
  viewMode="grid"
  theme={theme}
  showName={showMediaName}
  showTags={showMediaTags}
  resetScrollKey={resetScrollKey}
/>
```

#### 国际化配置

**更新** 新增国际化配置示例。

```typescript
// 在应用根组件中提供国际化支持
<I18nProvider>
  <ThemeProvider>
    <MediaGridContainer />
  </ThemeProvider>
</I18nProvider>

// 在组件中使用国际化
const { t } = useI18n()
return (
  <button title={t('inspector.favorite.add')}>
    {t('mediaCard.generatingThumb')}
  </button>
)
```

#### 最佳实践

1. **合理使用 memo**：确保传入的回调函数稳定，避免不必要的重渲染
2. **优化图片资源**：使用适当的图片尺寸和格式，减少加载时间
3. **主题一致性**：确保所有子组件使用相同的主题配置
4. **错误处理**：为所有异步操作提供适当的错误处理机制
5. **性能监控**：定期检查组件的渲染性能和内存使用情况
6. **国际化测试**：确保所有界面文本都有对应的翻译
7. **语言切换**：提供便捷的语言切换入口和持久化机制
8. **收藏按钮优化**：确保图标颜色和背景透明度符合设计规范
9. **显示自定义优化**：合理使用 `showName` 和 `showTags` 属性，避免过度渲染
10. **滚动重置优化**：确保筛选条件变化时的滚动重置逻辑正确执行

### 性能优化建议

1. **组件拆分**：将大型组件拆分为更小的功能模块
2. **懒加载**：对非关键资源使用懒加载策略
3. **缓存策略**：实现合理的数据缓存机制
4. **内存管理**：及时清理不需要的事件监听器和定时器
5. **代码分割**：按需加载组件代码，减少初始包大小
6. **国际化优化**：避免重复加载国际化资源，使用缓存机制
7. **错误处理优化**：减少错误处理对主线程的影响，使用异步处理
8. **收藏按钮优化**：使用 CSS 变量而非内联样式，提升渲染性能
9. **显示自定义优化**：通过条件渲染和动态样式计算提升性能
10. **滚动重置优化**：使用 useEffect 和状态管理优化滚动重置逻辑

### 国际化系统集成详解

**更新** 新增国际化系统集成的详细说明。

#### 国际化系统架构

```mermaid
graph TB
subgraph "国际化系统架构"
A[I18nContext] --> B[I18nProvider]
B --> C[语言检测]
B --> D[本地存储]
A --> E[翻译函数 t()]
E --> F[JSON资源文件]
F --> G[zh-CN.json]
F --> H[en-US.json]
I[Settings页面] --> A
J[App页面] --> A
K[MediaCard组件] --> A
L[MediaCardContextMenu] --> A
end
```

**图表来源**
- [I18nContext.tsx:1-51](file://src/contexts/I18nContext.tsx#L1-L51)
- [main.tsx:7-44](file://src/main.tsx#L7-L44)
- [Settings.tsx:144-171](file://src/pages/Settings.tsx#L144-L171)
- [App.tsx:126-158](file://src/App.tsx#L126-L158)

#### 语言切换流程

```mermaid
sequenceDiagram
participant User as 用户
participant Settings as Settings页面
participant I18n as I18nContext
participant App as App页面
User->>Settings : 选择新语言
Settings->>I18n : setLanguage(newLang)
I18n->>I18n : 保存到localStorage
I18n->>App : 发送语言变更事件
App->>App : 监听语言变更事件
App->>App : window.location.reload()
```

**图表来源**
- [Settings.tsx:144-171](file://src/pages/Settings.tsx#L144-L171)
- [App.tsx:126-158](file://src/App.tsx#L126-L158)

**章节来源**
- [I18nContext.tsx:22-48](file://src/contexts/I18nContext.tsx#L22-L48)
- [Settings.tsx:144-171](file://src/pages/Settings.tsx#L144-L171)
- [App.tsx:126-158](file://src/App.tsx#L126-L158)

### 收藏按钮样式规范

**更新** 新增收藏按钮样式规范的详细说明。

#### 设计规范

收藏按钮遵循以下设计规范以确保视觉一致性：

1. **尺寸规范**
   - 大小：`h-7 w-7` (1.75rem × 1.75rem)
   - 圆角：`rounded-full`
   - 位置：绝对定位，距离右上角 `top-2 right-2`

2. **颜色规范**
   - 背景：`rgba(255, 255, 255, 0.55)` (默认状态)
   - 悬停背景：`rgba(255, 255, 255, 0.75)`
   - 已收藏图标：`#F59E0B` (金黄色)
   - 未收藏图标：`rgba(0, 0, 0, 0.65)` (半透明黑色)

3. **交互规范**
   - 点击区域：1.75rem × 1.75rem
   - 悬停效果：背景透明度增加 0.2
   - 动画：`transition-colors` 150ms 缓动

4. **图标规范**
   - 星形图标：`M12 17.3 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z`
   - 尺寸：`h-4 w-4` (1rem × 1rem)
   - 实心填充：已收藏状态使用 `fill="currentColor"`
   - 空心描边：未收藏状态使用 `fill="none" stroke="currentColor"`

**章节来源**
- [MediaCard.tsx:153-196](file://src/components/MediaCard.tsx#L153-L196)
- [theme.ts:49](file://src/theme/theme.ts#L49)
- [index.css:52](file://src/index.css#L52)
- [index.css:102](file://src/index.css#L102)

### 媒体显示自定义规范

**更新** 新增媒体显示自定义功能的详细规范。

#### 显示控制规范

媒体显示自定义功能遵循以下规范以确保一致的用户体验：

1. **默认行为**
   - `showName` 默认值：`true`
   - `showTags` 默认值：`true`
   - 两个属性同时为 `true` 时显示完整的媒体信息

2. **显示组合规则**
   - `showName=true, showTags=true`：显示媒体名称和标签
   - `showName=true, showTags=false`：仅显示媒体名称
   - `showName=false, showTags=true`：仅显示标签
   - `showName=false, showTags=false`：仅显示媒体预览

3. **高度调整规则**
   - 网格视图高度：根据显示内容动态调整
   - 信息区域高度：与网格视图高度保持一致的比例关系
   - 最小高度保证：确保在任何显示组合下都有合适的最小高度

4. **样式应用规范**
   - 使用 CSS 类名控制显示状态
   - 通过内联样式动态计算高度
   - 使用主题变量支持主题切换
   - 确保条件渲染的性能优化

**章节来源**
- [MediaCard.tsx:277-362](file://src/components/MediaCard.tsx#L277-L362)
- [MediaCard.tsx:141-145](file://src/components/MediaCard.tsx#L141-L145)
- [MediaCard.tsx:271-276](file://src/components/MediaCard.tsx#L271-L276)