import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 声明顶层变量，用于存储worker实例
let workerInstance: any;

// 添加调试日志
console.log('🔧 browser.ts - 开始创建 MSW 服务工作者实例')
console.log('🔧 browser.ts - 处理程序数量:', handlers.length)

try {
  // 创建worker变量
  // @ts-ignore - 忽略 MSW v2 中的类型不匹配问题
  workerInstance = setupWorker(...handlers);

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

  try {
    // @ts-ignore - 忽略事件监听器类型错误
    workerInstance.events.on('request:start', ({ request }) => {
      console.log('🔄 MSW - 拦截到请求:', request.method, request.url)
    })

    // @ts-ignore - 忽略事件监听器类型错误
    workerInstance.events.on('request:end', ({ request, response }) => {
      console.log('✅ MSW - 请求已处理:', request.method, request.url, '状态:', response?.status)
    })

    // @ts-ignore - 忽略事件监听器类型错误
    workerInstance.events.on('request:unhandled', ({ request }) => {
      console.warn('⚠️ MSW - 未处理的请求:', request.method, request.url)
    })

    // @ts-ignore - 忽略事件监听器类型错误
    workerInstance.events.on('response:mocked', ({ response, request }) => {
      console.log('🔶 MSW - 模拟响应:', request.method, request.url, '状态:', response.status)
    })

    console.log('✅ browser.ts - 所有事件监听器已添加，MSW服务工作者准备就绪')
  } catch (error) {
    console.error('❌ browser.ts - 添加事件监听器失败:', error)
    // 即使事件监听器添加失败，也继续使用worker
  }

  // worker 将在顶层导出，这里不需要导出
} catch (error) {
  console.error('❌ browser.ts - 创建MSW服务工作者实例失败:', error)
  // 创建一个降级的worker对象
  workerInstance = {
    start: async () => {
      console.error('❌ 使用了降级的MSW worker')
      return Promise.resolve()
    }
  }
}

// 在顶层导出worker
export { workerInstance as worker }