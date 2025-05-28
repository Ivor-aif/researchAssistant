import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 强制启用API模拟
const FORCE_MOCK_API = true;

// 调试输出
console.log('Vite配置 - API模拟状态:', FORCE_MOCK_API ? '启用' : '禁用');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
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
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.VITE_FORCE_MOCK_API': JSON.stringify(FORCE_MOCK_API.toString()),
  },
})
