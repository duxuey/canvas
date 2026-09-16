/**
 * 统一设计 token —— 保持蓝色系，通过分块 / 图标 / 层级 / 底色统一全局视觉。
 * 供 JSX 内联样式引用，避免散落的魔法值。
 */

export const colors = {
  // 主色
  primary: '#5d9cec',
  primaryDark: '#4a8ad4',
  accent: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #5d9cec 0%, #8b5cf6 100%)',
  gradientPrimary: 'linear-gradient(135deg, #5d9cec, #4a8ad4)',

  // 语义色
  danger: '#ff4d4f',
  success: '#16a34a',
  warning: '#f59e0b',

  // 背景层级（从浅到深）
  bgPage: '#f0f4f8',      // 页面最外层
  bgCard: '#ffffff',      // 卡片
  bgSection: '#f6f9fc',   // 卡片内分组区块
  bgAccent: '#eff5fd',    // 强调块 / 信息提示 / 选中

  // 边框
  border: '#e2e8f0',
  borderLight: '#eef2f7',

  // 文字层级
  text: '#1e293b',        // 标题
  textBody: '#334155',    // 正文
  textSecondary: '#64748b', // 次要
  textMuted: '#94a3b8',   // 弱

  white: '#ffffff',
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
};

export const shadow = {
  card: '0 1px 3px rgba(15,23,42,.06)',
  hover: '0 4px 12px rgba(15,23,42,.08)',
  modal: '0 10px 30px rgba(15,23,42,.12)',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
