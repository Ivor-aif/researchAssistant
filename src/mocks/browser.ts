import { setupWorker } from 'msw'
import { handlers } from './handlers'

// 添加调试日志
console.log('🔧 browser.ts - 开始创建 MSW 服务工作者实例')
console.log('🔧 browser.ts - 处理程序数量:', handlers.length)

// 创建worker变量
let worker;

try {
  // 尝试创建MSW worker
  console.log('🔧 browser.ts - 调用 setupWorker 函数创建服务工作者...')
  worker = setupWorker(...handlers)
  
  // 添加更多调试日志
  console.log('✅ browser.ts - MSW 服务工作者实例已成功创建')
  
  // 添加调试信息，列出所有处理程序的路径
  if (handlers.length > 0) {
    console.log('📋 browser.ts - 已注册的API路径:')
    handlers.forEach((handler, index) => {
      // @ts-ignore - 访问MSW内部属性用于调试
      console.log(`   ${index + 1}. ${handler.info?.method || '未知方法'} ${handler.info?.path || '未知路径'}`)
    })
  } else {
    console.warn('⚠️ browser.ts - 警告：没有注册任何API处理程序')
  }
  
  // 添加自定义响应拦截器，用于调试
  console.log('🔧 browser.ts - 添加事件监听器...')
  worker.events.on('request:start', ({ request }) => {
    console.log('🔄 MSW - 拦截到请求:', request.method, request.url)
  })
  
  worker.events.on('request:end', ({ request, response }) => {
    console.log('✅ MSW - 请求已处理:', request.method, request.url, '状态:', response?.status)
  })
  
  worker.events.on('request:unhandled', ({ request }) => {
    console.warn('⚠️ MSW - 未处理的请求:', request.method, request.url)
  })
  
  worker.events.on('response:mocked', ({ response, request }) => {
    console.log('🔶 MSW - 模拟响应:', request.method, request.url, '状态:', response.status)
  })
  
  console.log('✅ browser.ts - 所有事件监听器已添加，MSW服务工作者准备就绪')
} catch (error) {
  console.error('❌ browser.ts - 创建MSW服务工作者失败:', error)
  
  // 创建一个更完整的虚拟worker对象，模拟MSW的行为
  const createNoopEventHandler = () => ({ unsubscribe: () => {} })
  
  worker = {
    start: (options) => {
      console.warn('⚠️ browser.ts - 使用虚拟worker启动MSW (实际未启动)')
      console.log('⚠️ browser.ts - 启动选项:', options)
      
      // 模拟处理API请求的行为
      setTimeout(() => {
        console.log('⚠️ browser.ts - 虚拟worker已激活，但不会实际拦截请求')
        console.log('⚠️ browser.ts - 请确保API请求能够正常工作，或检查控制台错误')
      }, 500)
      
      return Promise.resolve()
    },
    stop: () => {
      console.log('⚠️ browser.ts - 停止虚拟worker')
      return Promise.resolve()
    },
    resetHandlers: () => {
      console.log('⚠️ browser.ts - 重置虚拟worker处理程序')
    },
    events: {
      on: () => createNoopEventHandler(),
      removeAllListeners: () => {},
    }
  }
}

// 导出worker
export { worker }