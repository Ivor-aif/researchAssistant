// 消息相关类型定义

/**
 * 消息类型枚举
 */
export const MessageType = {
  SYSTEM: 'system',
  RESEARCH: 'research',
  PAPER: 'paper',
  PROGRESS: 'progress',
  NOTIFICATION: 'notification'
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

/**
 * 消息状态枚举
 */
export const MessageStatus = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

/**
 * 消息优先级枚举
 */
export const MessagePriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type MessagePriority = typeof MessagePriority[keyof typeof MessagePriority];

/**
 * 消息接口定义
 */
export interface Message {
  id: string;
  title: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  priority: MessagePriority;
  createdAt: string;
  updatedAt: string;
  userId: string;
  metadata?: {
    paperId?: string;
    projectId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
}

/**
 * 消息列表响应接口
 */
export interface MessageListResponse {
  messages: Message[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

/**
 * 消息筛选参数接口
 */
export interface MessageFilterParams {
  type?: MessageType;
  status?: MessageStatus;
  priority?: MessagePriority;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 创建消息请求接口
 */
export interface CreateMessageRequest {
  title: string;
  content: string;
  type: MessageType;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
}

/**
 * 更新消息状态请求接口
 */
export interface UpdateMessageStatusRequest {
  messageIds: string[];
  status: MessageStatus;
}

/**
 * 消息统计接口
 */
export interface MessageStats {
  total: number;
  unread: number;
  byType: Record<MessageType, number>;
  byPriority: Record<MessagePriority, number>;
}