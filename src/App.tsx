import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import router from './router';
import { AuthProvider } from './contexts/AuthContext';
import { PaperSearchProvider } from './contexts/PaperSearchContext';
import './App.css';

// 自定义主题配置
const themeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: '#f0f2f5',
      headerBg: '#1890ff',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Card: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Button: {
      primaryShadow: 'none',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AuthProvider>
        <PaperSearchProvider>
          <RouterProvider router={router} />
        </PaperSearchProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
