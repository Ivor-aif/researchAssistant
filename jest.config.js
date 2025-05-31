export default {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  
  // 转换器
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
  },
  
  // 模块名称映射
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // 设置测试文件的扩展名
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // 设置测试覆盖率收集
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
    '!src/index.tsx',
  ],
  
  // 设置测试覆盖率目录
  coverageDirectory: 'coverage',
  
  // 设置测试覆盖率报告
  coverageReporters: ['text', 'lcov'],
  
  // 设置测试覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 设置测试覆盖率路径忽略
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    '/__tests__/',
    '/mocks/',
  ],
  
  // 设置测试覆盖率报告器
  reporters: ['default'],
  
  // 设置测试超时时间
  testTimeout: 10000,
  
  // 设置测试环境变量
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};