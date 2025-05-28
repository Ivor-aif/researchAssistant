import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 获取API基础URL，用于调试输出
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
// 移除末尾的斜杠（如果有）
API_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
// 如果API_BASE_URL以'/api'结尾，则移除它，因为API路径已经包含了'/api'
if (API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.slice(0, -4);
}
console.log('🔧 main.tsx - 原始API基础URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
console.log('🔧 main.tsx - 处理后的API基础URL:', API_BASE_URL);

// 获取root元素
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ main.tsx - 找不到root元素，无法渲染应用');
  throw new Error('找不到root元素');
}

// 创建React根元素
const root = createRoot(rootElement);

// 显示加载中状态
root.render(
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    fontSize: '1.5rem',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
  }}>
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>加载中...</div>
      <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #3498db', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// 在开发环境中启动MSW
async function startMockServiceWorker() {
  console.log('🔄 main.tsx - 开始初始化MSW...');
  
  try {
    // 首先检查mockServiceWorker.js文件是否可访问
    console.log('🔄 main.tsx - 检查mockServiceWorker.js是否可访问...');
    try {
      const response = await fetch('/mockServiceWorker.js');
      console.log('✅ main.tsx - mockServiceWorker.js 可访问状态:', response.ok ? '成功' : '失败', '状态码:', response.status);
      if (!response.ok) {
        console.error('❌ main.tsx - mockServiceWorker.js 不可访问，状态码:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ main.tsx - 无法访问 mockServiceWorker.js:', error);
      return false;
    }
    
    // 导入MSW worker
    console.log('🔄 main.tsx - 尝试导入MSW worker...');
    const { worker } = await import('./mocks/browser');
    console.log('✅ main.tsx - 已成功导入MSW worker，准备启动...');
    
    // 启动MSW worker
    console.log('🔄 main.tsx - 开始启动MSW worker...');
    await worker.start({
      onUnhandledRequest: 'bypass', // 对于未处理的请求，直接绕过
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
        },
      },
    });
    
    console.log('🔶 main.tsx - MSW已成功启动：API请求将被模拟');
    console.log('🔶 main.tsx - API基础URL:', API_BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ main.tsx - MSW启动失败:', error);
    return false;
  }
}

// 渲染应用函数
function renderApp() {
  console.log('🚀 main.tsx - 开始渲染应用...')
  
  console.log('🚀 main.tsx - 渲染React应用...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ main.tsx - 应用渲染完成');
}

// 启动MSW并渲染应用
(async () => {
  try {
    console.log('🔄 main.tsx - 应用初始化开始...');
    console.log('🔄 main.tsx - 开始初始化MSW...');
    const mswStarted = await startMockServiceWorker();
    console.log('✅ main.tsx - MSW初始化状态:', mswStarted ? '成功' : '未启用');
    
    // 确保MSW完全初始化后再渲染应用
    console.log('⏳ main.tsx - 等待MSW完全初始化...');
    setTimeout(() => {
      console.log('🚀 main.tsx - 延迟结束，开始渲染应用...');
      renderApp();
    }, 2000); // 增加延迟时间到2秒，确保MSW完全初始化
  } catch (error) {
    console.error('❌ main.tsx - 应用初始化失败:', error);
    // 即使MSW初始化失败，也尝试渲染应用
    console.log('🔄 main.tsx - 尝试在MSW初始化失败后渲染应用...');
    renderApp();
  }
})();
