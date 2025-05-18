// 主题配置文件
// 用于统一整个应用的样式和颜色方案

export const theme = {
  // 颜色系统
  colors: {
    primary: '#1890ff',           // 主色调 - 蓝色
    secondary: '#52c41a',         // 辅助色 - 绿色
    success: '#52c41a',           // 成功色 - 绿色
    warning: '#faad14',           // 警告色 - 黄色
    error: '#f5222d',             // 错误色 - 红色
    info: '#1890ff',              // 信息色 - 蓝色
    background: '#f0f2f5',        // 背景色 - 浅灰色
    cardBackground: '#ffffff',    // 卡片背景色 - 白色
    textPrimary: 'rgba(0, 0, 0, 0.85)',  // 主要文本色
    textSecondary: 'rgba(0, 0, 0, 0.45)', // 次要文本色
    borderColor: '#f0f0f0',       // 边框颜色
    dividerColor: '#e8e8e8',      // 分割线颜色
    disabledColor: 'rgba(0, 0, 0, 0.25)', // 禁用状态颜色
    highlightColor: '#1890ff',    // 高亮色
  },
  
  // 字体系统
  typography: {
    fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 600,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8,
    },
  },
  
  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // 阴影系统
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.16)',
  },
  
  // 圆角系统
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '16px',
    circle: '50%',
  },
  
  // 过渡动画
  transitions: {
    fast: '0.1s',
    normal: '0.2s',
    slow: '0.3s',
  },
  
  // 响应式断点
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
  
  // 布局相关
  layout: {
    headerHeight: '64px',
    footerHeight: '48px',
    siderWidth: '220px',
    contentPadding: '24px',
  },
};

export default theme;