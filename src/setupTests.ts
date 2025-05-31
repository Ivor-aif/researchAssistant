import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// 配置测试库
configure({
  // 等待异步操作的超时时间
  asyncUtilTimeout: 5000,
  // 当元素不可见时抛出错误
  throwSuggestions: true,
});

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// 模拟 localStorage
class LocalStorageMock {
  store: Record<string, string>;

  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

// 设置全局 localStorage 模拟
Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
});

// 模拟 fetch
global.fetch = jest.fn();

// 清理所有模拟
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});