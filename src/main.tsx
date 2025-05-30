import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 调试信息
console.log('🚀 main.tsx - 应用入口文件开始执行')

// 在开发环境中启用API模拟
async function initMSW() {
  if (import.meta.env.MODE === 'development' && import.meta.env.VITE_ENABLE_API_MOCKING === 'true') {
    try {
      console.log('🔧 main.tsx - API模拟已启用，正在初始化MSW...');
      const { worker } = await import('./mocks/browser');
      
      // 启动MSW服务工作者
      if (worker && typeof worker.start === 'function') {
        await worker.start({
          onUnhandledRequest: 'warn', // 对于未处理的请求，显示警告以便调试
        }).then(() => {
          console.log('✅ main.tsx - MSW已成功启动');
        }).catch((error) => {
          console.error('❌ main.tsx - MSW启动失败:', error);
        });
      } else {
        console.error('❌ main.tsx - MSW worker对象无效');
      }
    } catch (error) {
      console.error('❌ main.tsx - 导入MSW模块失败:', error);
    }
  } else {
    console.log('ℹ️ main.tsx - API模拟已禁用或非开发环境');
  }
}

// 初始化应用
async function initApp() {
  console.log('🚀 main.tsx - 开始初始化应用')
  
  // 先初始化MSW
  await initMSW()
  
  // 然后渲染React应用
  console.log('🚀 main.tsx - 开始渲染React应用')
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ main.tsx - React应用渲染完成')
}

// 执行初始化
initApp().catch(error => {
  console.error('🔴 main.tsx - 应用初始化失败:', error)
  
  // 显示错误信息在页面上
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; margin-top: 50px;">
        <h2>应用初始化失败</h2>
        <p>请检查控制台获取详细错误信息</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px; overflow: auto;">
          ${error?.toString() || '未知错误'}
        </pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          刷新页面
        </button>
      </div>
    `
  }
})
