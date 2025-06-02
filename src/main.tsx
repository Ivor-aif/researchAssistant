import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 调试信息
console.log('🚀 main.tsx - 应用入口文件开始执行')

// 在开发环境中启用API模拟（如果配置了）
// 定义MSW初始化状态变量，用于跟踪MSW是否成功初始化
let mswInitialized = false;

// 定义一个类型，表示从mocks/browser导入的模块结构
type MSWModule = {
  worker: {
    start: (options: any) => Promise<any>;
  };
};

async function initMSW() {
  // 如果不是开发环境或者API模拟被禁用，直接返回
  if (import.meta.env.MODE !== 'development' || import.meta.env.VITE_ENABLE_API_MOCKING !== 'true') {
    console.log('ℹ️ main.tsx - API模拟已禁用或非开发环境');
    return;
  }
  
  try {
    console.log('🔧 main.tsx - API模拟已启用，正在初始化MSW...');
    // 设置超时，确保MSW初始化不会无限期阻塞应用渲染
    const mswPromise = import('./mocks/browser');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MSW初始化超时')), 3000);
    });
    
    // 使用Promise.race确保不会无限期等待MSW初始化
    // 使用类型断言确保TypeScript理解返回的结构
    const result = await Promise.race<typeof mswPromise | typeof timeoutPromise>([mswPromise, timeoutPromise])
      .catch((error: Error) => {
        console.error('❌ main.tsx - MSW初始化超时或失败:', error);
        return { worker: undefined } as unknown as Partial<MSWModule>;
      }) as unknown as Partial<MSWModule>;
    
    // 使用类型断言告诉TypeScript worker的类型
    const { worker } = result as Partial<MSWModule>;
    
    // 如果worker不存在，直接返回
    if (!worker || typeof worker.start !== 'function') {
      console.error('❌ main.tsx - MSW worker对象无效');
      return;
    }
    
    // 启动MSW服务工作者
    await worker.start({
      onUnhandledRequest: 'bypass', // 对于未处理的请求，直接绕过而不是警告
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
        },
      },
    }).catch((error: Error) => {
      console.error('❌ main.tsx - MSW服务工作者启动失败:', error);
    });
    
    console.log('✅ main.tsx - MSW已成功启动');
    mswInitialized = true;
    // 在控制台输出MSW初始化状态，确保变量被使用
    console.log('📊 main.tsx - MSW初始化状态:', mswInitialized ? '成功' : '失败');
  } catch (error: unknown) {
    // 使用unknown类型，然后在使用时进行类型检查
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ main.tsx - MSW初始化过程中发生错误:', errorMessage);
    // 即使MSW初始化失败，也继续渲染应用
  }
}

// 渲染React应用
function renderApp() {
  console.log('🚀 main.tsx - 开始渲染React应用');

  // 尝试获取主根元素
  let rootElement = document.getElementById('root');
  let usingFallback = false;

  // 如果主根元素不存在，尝试使用备用根元素
  if (!rootElement) {
    console.warn('⚠️ main.tsx - 找不到主根元素 #root，尝试使用备用根元素');
    rootElement = document.getElementById('fallback-root');
    usingFallback = true;
    
    if (rootElement) {
      console.log('🔧 main.tsx - 使用备用根元素 #fallback-root');
    }
  }

  // 如果找到了根元素（主要或备用），尝试渲染应用
  if (rootElement) {
    try {
      // 清空根元素内容，确保没有加载指示器或其他内容
      rootElement.innerHTML = '';
      
      // 创建React根元素并渲染应用
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log('✅ main.tsx - React应用渲染完成' + (usingFallback ? ' (使用备用根元素)' : ''));
    } catch (error: unknown) {
      console.error('🔴 main.tsx - React应用渲染失败:', error);
      
      // 显示错误信息在页面上
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; margin-top: 50px;">
          <h2>应用渲染失败</h2>
          <p>请检查控制台获取详细错误信息</p>
          <pre style="text-align: left; background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px; overflow: auto;">
            ${error instanceof Error ? error.message : String(error)}
          </pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  } else {
    console.error('🔴 main.tsx - 找不到任何根元素，尝试创建一个');
    // 尝试创建根元素
    const bodyElement = document.body;
    if (bodyElement) {
      const newRootElement = document.createElement('div');
      newRootElement.id = 'root';
      bodyElement.appendChild(newRootElement);
      console.log('🔧 main.tsx - 已创建新的根元素 #root，尝试重新渲染');
      // 短暂延迟后重新尝试渲染，确保DOM已更新
      setTimeout(() => renderApp(), 100);
    } else {
      console.error('🔴 main.tsx - 找不到body元素，无法创建根元素');
      // 最后的尝试：直接在document上创建body和root
      try {
        const newBodyElement = document.createElement('body');
        const newRootElement = document.createElement('div');
        newRootElement.id = 'emergency-root';
        newBodyElement.appendChild(newRootElement);
        document.documentElement.appendChild(newBodyElement);
        console.log('🚨 main.tsx - 已创建紧急根元素，最后尝试渲染');
        setTimeout(() => renderApp(), 100);
      } catch (e: unknown) {
        console.error('💥 main.tsx - 所有渲染尝试均失败:', e instanceof Error ? e.message : String(e));
      }
    }
  }
}

// 启动应用 - 先初始化MSW，但不等待它完成
initMSW().catch((error: Error) => {
  console.error('❌ main.tsx - MSW初始化失败，但将继续渲染应用:', error.message);
}).finally(() => {
  // 无论MSW初始化成功与否，都渲染应用
  // 在控制台输出MSW初始化状态
  console.log('📊 main.tsx - 最终MSW初始化状态:', mswInitialized ? '成功' : '失败');
  renderApp();
});
