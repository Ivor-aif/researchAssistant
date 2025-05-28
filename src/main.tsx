import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 调试信息
console.log('🚀 main.tsx - 应用入口文件开始执行')

// 确保MSW在开发环境中正确初始化
async function initMSW() {
  if (import.meta.env.DEV) {
    try {
      console.log('🚀 main.tsx - 尝试初始化MSW')
      const { worker } = await import('./mocks/browser')
      console.log('🚀 main.tsx - MSW worker导入成功:', worker)
      
      // 确保worker存在且有start方法
      if (worker && typeof worker.start === 'function') {
        console.log('🚀 main.tsx - 开始启动MSW worker')
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        }).catch(error => {
          console.error('🔴 MSW worker启动失败:', error)
        })
        console.log('✅ main.tsx - MSW worker启动成功')
      } else {
        console.error('🔴 main.tsx - MSW worker对象无效:', worker)
      }
    } catch (error) {
      console.error('🔴 main.tsx - MSW初始化失败:', error)
    }
  } else {
    console.log('📝 main.tsx - 非开发环境，跳过MSW初始化')
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
