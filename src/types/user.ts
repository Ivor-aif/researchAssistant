// 用户相关类型定义

/**
 * 用户个人资料接口定义
 */
export interface UserProfile {
  id: number;
  username: string;
  author_name?: string; // 论文署名名称
  author_email?: string; // 通讯作者邮箱
  author_website?: string; // 个人网站链接
}

/**
 * API密钥接口定义
 */
export interface ApiKeys {
  openai_api_key: string;
  other_api_keys?: Record<string, string>; // 其他AI服务API密钥
}

/**
 * 更新个人资料请求接口
 */
export interface UpdateProfileRequest {
  username?: string;
  author_name?: string;
  author_email?: string;
  author_website?: string;
}

/**
 * 更新API密钥请求接口
 */
export interface UpdateApiKeysRequest {
  openai_api_key?: string;
  other_api_keys?: Record<string, string>;
}