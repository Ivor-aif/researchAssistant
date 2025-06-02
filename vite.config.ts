import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  
  // 从环境变量中读取API模拟设置
  const FORCE_MOCK_API = env.VITE_ENABLE_API_MOCKING === 'true';
  
  // 调试输出
  console.log('Vite配置 - API模拟状态:', FORCE_MOCK_API ? '启用' : '禁用');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      host: true, // 允许所有主机访问
      strictPort: false, // 如果端口被占用，尝试下一个可用端口
      https: false, // 禁用HTTPS
      cors: true, // 启用CORS
      // 当API模拟启用时，禁用代理
      proxy: FORCE_MOCK_API ? undefined : {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    // 确保开发服务器正确处理 MSW 的 service worker
    optimizeDeps: {
      exclude: ['msw'],
    },
    // 添加 MSW 相关的环境变量
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_FORCE_MOCK_API': JSON.stringify(FORCE_MOCK_API.toString()),
    },
  }
})
