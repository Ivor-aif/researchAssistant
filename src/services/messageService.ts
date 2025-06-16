import { message as antdMessage } from 'antd';
import type {
  Message,
  MessageListResponse,
  MessageFilterParams,
  CreateMessageRequest,
  UpdateMessageStatusRequest,
  MessageStats
} from '../types/message';
import {
  MessageType,
  MessageStatus,
  MessagePriority
} from '../types/message';

// 模拟消息数据
const mockMessages: Message[] = [
  {
    id: '1',
    title: '论文检索完成',
    content: '您的论文检索任务已完成，共找到 25 篇相关论文。',
    type: MessageType.PAPER,
    status: MessageStatus.UNREAD,
    priority: MessagePriority.NORMAL,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    userId: 'current-user',
    metadata: {
      paperId: 'search-123',
      actionUrl: '/paper-search'
    }
  },
  {
    id: '2',
    title: '创新点分析报告',
    content: '您提交的论文创新点分析已完成，发现了 3 个潜在的创新点。',
    type: MessageType.RESEARCH,
    status: MessageStatus.UNREAD,
    priority: MessagePriority.HIGH,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    userId: 'current-user',
    metadata: {
      paperId: 'analysis-456',
      actionUrl: '/innovation-analysis'
    }
  },
  {
    id: '3',
    title: '系统维护通知',
    content: '系统将于今晚 23:00-01:00 进行维护升级，期间可能影响部分功能使用。',
    type: MessageType.SYSTEM,
    status: MessageStatus.READ,
    priority: MessagePriority.NORMAL,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    userId: 'current-user'
  },
  {
    id: '4',
    title: '研究进度更新',
    content: '您的研究项目"深度学习在自然语言处理中的应用"进度已更新至 75%。',
    type: MessageType.PROGRESS,
    status: MessageStatus.UNREAD,
    priority: MessagePriority.NORMAL,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    userId: 'current-user',
    metadata: {
      projectId: 'project-789',
      actionUrl: '/research-progress'
    }
  },
  {
    id: '5',
    title: 'API 密钥即将过期',
    content: '您的 OpenAI API 密钥将在 7 天后过期，请及时更新。',
    type: MessageType.NOTIFICATION,
    status: MessageStatus.UNREAD,
    priority: MessagePriority.URGENT,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    userId: 'current-user',
    metadata: {
      actionUrl: '/auth?settings=true'
    }
  }
];

/**
 * 获取消息列表
 */
export const getMessages = async (params: MessageFilterParams = {}): Promise<MessageListResponse> => {
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredMessages = [...mockMessages];
    
    // 按类型筛选
    if (params.type) {
      filteredMessages = filteredMessages.filter(msg => msg.type === params.type);
    }
    
    // 按状态筛选
    if (params.status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === params.status);
    }
    
    // 按优先级筛选
    if (params.priority) {
      filteredMessages = filteredMessages.filter(msg => msg.priority === params.priority);
    }
    
    // 按时间范围筛选
    if (params.startDate) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createdAt) >= new Date(params.startDate!)
      );
    }
    
    if (params.endDate) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createdAt) <= new Date(params.endDate!)
      );
    }
    
    // 按创建时间倒序排列
    filteredMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    // 计算未读数量
    const unreadCount = mockMessages.filter(msg => msg.status === MessageStatus.UNREAD).length;
    
    return {
      messages: paginatedMessages,
      total: filteredMessages.length,
      unreadCount,
      page,
      pageSize
    };
  } catch (error) {
    console.error('获取消息列表失败:', error);
    throw error;
  }
};

/**
 * 获取消息详情
 */
export const getMessageById = async (messageId: string): Promise<Message | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const message = mockMessages.find(msg => msg.id === messageId);
    return message || null;
  } catch (error) {
    console.error('获取消息详情失败:', error);
    throw error;
  }
};

/**
 * 更新消息状态
 */
export const updateMessageStatus = async (request: UpdateMessageStatusRequest): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 在实际项目中，这里应该调用后端API
    // 这里只是模拟更新本地数据
    request.messageIds.forEach(messageId => {
      const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        mockMessages[messageIndex].status = request.status;
        mockMessages[messageIndex].updatedAt = new Date().toISOString();
      }
    });
    
    antdMessage.success('消息状态更新成功');
    return true;
  } catch (error) {
    console.error('更新消息状态失败:', error);
    antdMessage.error('更新消息状态失败');
    return false;
  }
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (messageIds: string[]): Promise<boolean> => {
  return updateMessageStatus({
    messageIds,
    status: MessageStatus.READ
  });
};

/**
 * 标记消息为未读
 */
export const markAsUnread = async (messageIds: string[]): Promise<boolean> => {
  return updateMessageStatus({
    messageIds,
    status: MessageStatus.UNREAD
  });
};

/**
 * 归档消息
 */
export const archiveMessages = async (messageIds: string[]): Promise<boolean> => {
  return updateMessageStatus({
    messageIds,
    status: MessageStatus.ARCHIVED
  });
};

/**
 * 删除消息
 */
export const deleteMessages = async (messageIds: string[]): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 在实际项目中，这里应该调用后端API
    messageIds.forEach(messageId => {
      const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        mockMessages.splice(messageIndex, 1);
      }
    });
    
    antdMessage.success('消息删除成功');
    return true;
  } catch (error) {
    console.error('删除消息失败:', error);
    antdMessage.error('删除消息失败');
    return false;
  }
};

/**
 * 获取消息统计
 */
export const getMessageStats = async (): Promise<MessageStats> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const total = mockMessages.length;
    const unread = mockMessages.filter(msg => msg.status === MessageStatus.UNREAD).length;
    
    const byType = {
      [MessageType.SYSTEM]: mockMessages.filter(msg => msg.type === MessageType.SYSTEM).length,
      [MessageType.RESEARCH]: mockMessages.filter(msg => msg.type === MessageType.RESEARCH).length,
      [MessageType.PAPER]: mockMessages.filter(msg => msg.type === MessageType.PAPER).length,
      [MessageType.PROGRESS]: mockMessages.filter(msg => msg.type === MessageType.PROGRESS).length,
      [MessageType.NOTIFICATION]: mockMessages.filter(msg => msg.type === MessageType.NOTIFICATION).length
    };
    
    const byPriority = {
      [MessagePriority.LOW]: mockMessages.filter(msg => msg.priority === MessagePriority.LOW).length,
      [MessagePriority.NORMAL]: mockMessages.filter(msg => msg.priority === MessagePriority.NORMAL).length,
      [MessagePriority.HIGH]: mockMessages.filter(msg => msg.priority === MessagePriority.HIGH).length,
      [MessagePriority.URGENT]: mockMessages.filter(msg => msg.priority === MessagePriority.URGENT).length
    };
    
    return {
      total,
      unread,
      byType,
      byPriority
    };
  } catch (error) {
    console.error('获取消息统计失败:', error);
    throw error;
  }
};

/**
 * 获取未读消息数量
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const stats = await getMessageStats();
    return stats.unread;
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    return 0;
  }
};

/**
 * 创建新消息（系统内部使用）
 */
export const createMessage = async (request: CreateMessageRequest): Promise<Message | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newMessage: Message = {
      id: Date.now().toString(),
      title: request.title,
      content: request.content,
      type: request.type,
      status: MessageStatus.UNREAD,
      priority: request.priority || MessagePriority.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'current-user',
      metadata: request.metadata
    };
    
    mockMessages.unshift(newMessage);
    return newMessage;
  } catch (error) {
    console.error('创建消息失败:', error);
    return null;
  }
};