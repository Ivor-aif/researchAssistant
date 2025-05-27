import { message } from 'antd';

/**
 * 获取当前登录用户信息
 * @returns 用户信息或null
 */
export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 退出登录
 * @returns 是否成功退出
 */
export const logout = (): boolean => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    return true;
  } catch (error: any) {
    console.error('退出登录失败:', error);
    
    // 获取详细错误信息
    let errorMessage = '退出登录失败';
    
    // 尝试从错误对象中提取更详细的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // 显示错误信息
    message.error(`退出登录失败: ${errorMessage}`);
    return false;
  }
};

/**
 * 更新用户信息
 * @param userData 更新的用户数据
 * @returns 是否成功
 */
export const updateUserInfo = (userData: any): boolean => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      message.error('用户未登录');
      return false;
    }
    
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    message.success('用户信息已更新');
    return true;
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    
    // 获取详细错误信息
    let errorMessage = '更新用户信息失败';
    
    // 尝试从错误对象中提取更详细的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : errorMessage;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // 显示错误信息
    message.error(`更新用户信息失败: ${errorMessage}`);
    return false;
  }
};