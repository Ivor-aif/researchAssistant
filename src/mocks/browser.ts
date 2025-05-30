import { setupWorker } from 'msw'
import { handlers } from './handlers'

// 添加调试日志
console.log('🔧 browser.ts - 开始创建 MSW 服务工作者实例')
console.log('🔧 browser.ts - 处理程序数量:', handlers.length)

// 创建worker变量
const worker = setupWorker(...handlers);

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

// 导出worker，确保MSW正确初始化
export { worker }