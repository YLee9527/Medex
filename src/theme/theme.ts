/**
 * 主题颜色配置
 * 深色主题为原始设计，浅色主题基于深色主题自动生成
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // 基础背景色
  background: string;
  sidebar: string;
  main: string;
  inspector: string;
  card: string;          // 卡片背景
  toolbar: string;       // 工具栏背景
  
  // 文本颜色
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // 边框颜色
  border: string;
  borderLight: string;
  
  // 交互色
  hover: string;
  active: string;
  selected: string;
  selectionOverlay: string; // 选中遮罩
  
  // 输入框
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  
  // 标签
  tagBg: string;
  tagHover: string;
  
  // 按钮
  buttonBg: string;
  buttonHover: string;
  
  // 遮罩层
  overlay: string;
  
  // 功能色
  favorite: string;
  highlight: string;
  progress: string;      // 进度条颜色
}

export const darkTheme: ThemeColors = {
  // 基础背景色
  background: '#101010',
  sidebar: '#1E1E1E',
  main: '#101010',
  inspector: '#1E1E1E',
  card: '#242424',
  toolbar: '#242424',
  
  // 文本颜色
  text: '#EAEAEA',
  textSecondary: 'rgba(255, 255, 255, 0.85)',
  textTertiary: 'rgba(255, 255, 255, 0.60)',
  
  // 边框颜色
  border: 'rgba(255, 255, 255, 0.20)',
  borderLight: 'rgba(255, 255, 255, 0.10)',
  
  // 交互色
  hover: 'rgba(255, 255, 255, 0.10)',
  active: '#444444',
  selected: '#444444',
  selectionOverlay: 'rgba(59, 130, 246, 0.20)',
  
  // 输入框
  inputBg: 'rgba(0, 0, 0, 0.20)',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputFocusBorder: 'rgba(255, 255, 255, 0.30)',
  
  // 标签
  tagBg: 'rgba(255, 255, 255, 0.10)',
  tagHover: '#555555',
  
  // 按钮
  buttonBg: '#444444',
  buttonHover: '#555555',
  
  // 遮罩层
  overlay: 'rgba(0, 0, 0, 0.40)',
  
  // 功能色
  favorite: '#FCD34D',
  highlight: '#3B82F6',
  progress: '#4A90E2'
};

/**
 * 根据深色主题生成浅色主题
 * 通过颜色反转和对比度调整来生成合适的浅色主题
 */
export function generateLightTheme(dark: ThemeColors): ThemeColors {
  return {
    // 基础背景色 - 反转为浅色
    background: '#FFFFFF',
    sidebar: '#F5F5F5',
    main: '#FAFAFA',
    inspector: '#F5F5F5',
    card: '#FFFFFF',
    toolbar: '#FFFFFF',
    
    // 文本颜色 - 深色文本以保证对比度
    text: '#1A1A1A',
    textSecondary: 'rgba(0, 0, 0, 0.75)',
    textTertiary: 'rgba(0, 0, 0, 0.50)',
    
    // 边框颜色 - 使用较浅的灰色
    border: 'rgba(0, 0, 0, 0.20)',
    borderLight: 'rgba(0, 0, 0, 0.10)',
    
    // 交互色 - 浅色背景上的悬停效果
    hover: 'rgba(0, 0, 0, 0.05)',
    active: '#E0E0E0',
    selected: '#E0E0E0',
    selectionOverlay: 'rgba(37, 99, 235, 0.15)',
    
    // 输入框
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(0, 0, 0, 0.15)',
    inputFocusBorder: 'rgba(0, 0, 0, 0.30)',
    
    // 标签
    tagBg: 'rgba(0, 0, 0, 0.08)',
    tagHover: '#E5E5E5',
    
    // 按钮
    buttonBg: '#E0E0E0',
    buttonHover: '#D0D0D0',
    
    // 遮罩层
    overlay: 'rgba(0, 0, 0, 0.30)',
    
    // 功能色 - 保持一致
    favorite: '#F59E0B',
    highlight: '#2563EB',
    progress: '#3B82F6'
  };
}

export const lightTheme = generateLightTheme(darkTheme);

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme
};
