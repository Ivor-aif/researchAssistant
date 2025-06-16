import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Badge,
  Button,
  Space,
  Typography,
  Tag,
  Select,
  DatePicker,
  Input,
  Checkbox,
  Modal,
  Empty,
  Spin,
  Divider,
  message as antdMessage
} from 'antd';
import {
  BellOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InboxOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BulbOutlined,
  BarChartOutlined,
  SettingOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type {
  Message,
  MessageFilterParams
} from '../../types/message';
import {
  MessageType,
  MessageStatus,
  MessagePriority
} from '../../types/message';
import {
  getMessages,
  getMessageById,
  markAsRead,
  markAsUnread,
  archiveMessages,
  deleteMessages
} from '../../services/messageService';
import './style.css';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

// 消息类型配置
const messageTypeConfig = {
  [MessageType.SYSTEM]: {
    label: '系统消息',
    color: 'blue',
    icon: <SettingOutlined />
  },
  [MessageType.RESEARCH]: {
    label: '研究消息',
    color: 'green',
    icon: <BulbOutlined />
  },
  [MessageType.PAPER]: {
    label: '论文消息',
    color: 'purple',
    icon: <FileTextOutlined />
  },
  [MessageType.PROGRESS]: {
    label: '进度消息',
    color: 'orange',
    icon: <BarChartOutlined />
  },
  [MessageType.NOTIFICATION]: {
    label: '通知消息',
    color: 'red',
    icon: <NotificationOutlined />
  }
};

// 优先级配置
const priorityConfig = {
  [MessagePriority.LOW]: {
    label: '低',
    color: 'default'
  },
  [MessagePriority.NORMAL]: {
    label: '普通',
    color: 'blue'
  },
  [MessagePriority.HIGH]: {
    label: '高',
    color: 'orange'
  },
  [MessagePriority.URGENT]: {
    label: '紧急',
    color: 'red'
  }
};

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [filterParams, setFilterParams] = useState<MessageFilterParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    unreadCount: 0
  });
  const [messageDetail, setMessageDetail] = useState<Message | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // 加载消息列表
  const loadMessages = async (params: MessageFilterParams = {}) => {
    setLoading(true);
    try {
      const response = await getMessages({
        ...filterParams,
        ...params,
        page: params.page || pagination.current,
        pageSize: pagination.pageSize
      });
      
      setMessages(response.messages);
      setPagination(prev => ({
        ...prev,
        current: response.page,
        total: response.total,
        unreadCount: response.unreadCount
      }));
    } catch (error) {
      antdMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadMessages();
  }, []);

  // 处理消息选择
  const handleSelectMessage = (messageId: string, checked: boolean) => {
    if (checked) {
      setSelectedMessages(prev => [...prev, messageId]);
    } else {
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(messages.map(msg => msg.id));
    } else {
      setSelectedMessages([]);
    }
  };

  // 标记为已读
  const handleMarkAsRead = async (messageIds?: string[]) => {
    const ids = messageIds || selectedMessages;
    if (ids.length === 0) {
      antdMessage.warning('请选择要操作的消息');
      return;
    }
    
    const success = await markAsRead(ids);
    if (success) {
      loadMessages();
      setSelectedMessages([]);
    }
  };

  // 标记为未读
  const handleMarkAsUnread = async (messageIds?: string[]) => {
    const ids = messageIds || selectedMessages;
    if (ids.length === 0) {
      antdMessage.warning('请选择要操作的消息');
      return;
    }
    
    const success = await markAsUnread(ids);
    if (success) {
      loadMessages();
      setSelectedMessages([]);
    }
  };

  // 归档消息
  const handleArchive = async () => {
    if (selectedMessages.length === 0) {
      antdMessage.warning('请选择要归档的消息');
      return;
    }
    
    const success = await archiveMessages(selectedMessages);
    if (success) {
      loadMessages();
      setSelectedMessages([]);
    }
  };

  // 删除消息
  const handleDelete = async () => {
    if (selectedMessages.length === 0) {
      antdMessage.warning('请选择要删除的消息');
      return;
    }
    
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedMessages.length} 条消息吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const success = await deleteMessages(selectedMessages);
        if (success) {
          loadMessages();
          setSelectedMessages([]);
        }
      }
    });
  };

  // 查看消息详情
  const handleViewDetail = async (messageId: string) => {
    try {
      const message = await getMessageById(messageId);
      if (message) {
        setMessageDetail(message);
        setDetailVisible(true);
        
        // 如果是未读消息，标记为已读
        if (message.status === MessageStatus.UNREAD) {
          await markAsRead([messageId]);
          loadMessages();
        }
      }
    } catch (error) {
      antdMessage.error('获取消息详情失败');
    }
  };

  // 处理消息操作（跳转到相关页面）
  const handleMessageAction = (message: Message) => {
    if (message.metadata?.actionUrl) {
      navigate(message.metadata.actionUrl);
    }
  };

  // 应用筛选
  const handleApplyFilter = (params: MessageFilterParams) => {
    setFilterParams(params);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadMessages({ ...params, page: 1 });
  };

  // 重置筛选
  const handleResetFilter = () => {
    setFilterParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    loadMessages({ page: 1 });
  };

  // 刷新消息
  const handleRefresh = () => {
    loadMessages();
  };

  // 分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
    loadMessages({ page, pageSize });
  };

  // 批量操作菜单
  const batchActionItems = [
    {
      key: 'markRead',
      label: '标记为已读',
      icon: <EyeOutlined />,
      onClick: () => handleMarkAsRead()
    },
    {
      key: 'markUnread',
      label: '标记为未读',
      icon: <EyeInvisibleOutlined />,
      onClick: () => handleMarkAsUnread()
    },
    {
      key: 'archive',
      label: '归档',
      icon: <InboxOutlined />,
      onClick: handleArchive
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: handleDelete,
      danger: true
    }
  ];

  // 格式化时间
  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    
    if (diff < 60 * 1000) {
      return '刚刚';
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    } else {
      return time.toLocaleDateString();
    }
  };

  return (
    <div className="messages-container">
      <Card bordered={false}>
        {/* 页面标题 */}
        <div className="messages-header">
          <div className="header-left">
            <Title level={4} style={{ margin: 0 }}>
              <BellOutlined style={{ marginRight: 8 }} />
              消息中心
            </Title>
            <Badge 
              count={pagination.unreadCount} 
              style={{ marginLeft: 12 }}
              showZero={false}
            />
          </div>
          <Space>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setShowFilters(!showFilters)}
            >
              筛选
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选器 */}
        {showFilters && (
          <Card size="small" style={{ marginTop: 16, backgroundColor: '#fafafa' }}>
            <Space wrap>
              <Select
                placeholder="消息类型"
                style={{ width: 120 }}
                allowClear
                value={filterParams.type}
                onChange={(value) => setFilterParams(prev => ({ ...prev, type: value }))}
              >
                {Object.entries(messageTypeConfig).map(([key, config]) => (
                  <Select.Option key={key} value={key}>
                    {config.icon} {config.label}
                  </Select.Option>
                ))}
              </Select>
              
              <Select
                placeholder="消息状态"
                style={{ width: 120 }}
                allowClear
                value={filterParams.status}
                onChange={(value) => setFilterParams(prev => ({ ...prev, status: value }))}
              >
                <Select.Option value={MessageStatus.UNREAD}>未读</Select.Option>
                <Select.Option value={MessageStatus.READ}>已读</Select.Option>
                <Select.Option value={MessageStatus.ARCHIVED}>已归档</Select.Option>
              </Select>
              
              <Select
                placeholder="优先级"
                style={{ width: 100 }}
                allowClear
                value={filterParams.priority}
                onChange={(value) => setFilterParams(prev => ({ ...prev, priority: value }))}
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <Select.Option key={key} value={key}>
                    {config.label}
                  </Select.Option>
                ))}
              </Select>
              
              <Button type="primary" onClick={() => handleApplyFilter(filterParams)}>
                应用筛选
              </Button>
              <Button onClick={handleResetFilter}>
                重置
              </Button>
            </Space>
          </Card>
        )}

        {/* 批量操作栏 */}
        {selectedMessages.length > 0 && (
          <Card size="small" style={{ marginTop: 16, backgroundColor: '#e6f7ff' }}>
            <Space>
              <Checkbox
                checked={selectedMessages.length === messages.length}
                indeterminate={selectedMessages.length > 0 && selectedMessages.length < messages.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                已选择 {selectedMessages.length} 条消息
              </Checkbox>
              
              <Divider type="vertical" />
              
              <Space>
                {batchActionItems.map(item => (
                  <Button
                    key={item.key}
                    size="small"
                    icon={item.icon}
                    danger={item.danger}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        )}

        {/* 消息列表 */}
        <div style={{ marginTop: 16 }}>
          <Spin spinning={loading}>
            {messages.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无消息"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <List
                itemLayout="vertical"
                size="large"
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  onChange: handlePageChange,
                  onShowSizeChange: handlePageChange
                }}
                dataSource={messages}
                renderItem={(message) => {
                  const typeConfig = messageTypeConfig[message.type];
                  const priorityConf = priorityConfig[message.priority];
                  const isUnread = message.status === MessageStatus.UNREAD;
                  
                  return (
                    <List.Item
                      key={message.id}
                      className={`message-item ${isUnread ? 'unread' : 'read'}`}
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetail(message.id)}
                        >
                          查看详情
                        </Button>,
                        isUnread ? (
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleMarkAsRead([message.id])}
                          >
                            标记已读
                          </Button>
                        ) : (
                          <Button
                            type="text"
                            size="small"
                            icon={<ClockCircleOutlined />}
                            onClick={() => handleMarkAsUnread([message.id])}
                          >
                            标记未读
                          </Button>
                        ),
                        message.metadata?.actionUrl && (
                          <Button
                            type="text"
                            size="small"
                            onClick={() => handleMessageAction(message)}
                          >
                            查看详情
                          </Button>
                        )
                      ].filter(Boolean)}
                    >
                      <div className="message-content">
                        <div className="message-header">
                          <Checkbox
                            checked={selectedMessages.includes(message.id)}
                            onChange={(e) => handleSelectMessage(message.id, e.target.checked)}
                            style={{ marginRight: 12 }}
                          />
                          
                          <Space>
                            <Tag color={typeConfig.color} icon={typeConfig.icon}>
                              {typeConfig.label}
                            </Tag>
                            
                            <Tag color={priorityConf.color}>
                              {priorityConf.label}
                            </Tag>
                            
                            {isUnread && (
                              <Badge status="processing" text="未读" />
                            )}
                          </Space>
                          
                          <Text type="secondary" style={{ marginLeft: 'auto' }}>
                            {formatTime(message.createdAt)}
                          </Text>
                        </div>
                        
                        <Title level={5} style={{ margin: '8px 0 4px 0', fontWeight: isUnread ? 600 : 400 }}>
                          {message.title}
                        </Title>
                        
                        <Paragraph
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{ margin: 0, color: isUnread ? '#000' : '#666' }}
                        >
                          {message.content}
                        </Paragraph>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Spin>
        </div>
      </Card>

      {/* 消息详情弹窗 */}
      <Modal
        title="消息详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          messageDetail?.metadata?.actionUrl && (
            <Button
              key="action"
              type="primary"
              onClick={() => {
                handleMessageAction(messageDetail);
                setDetailVisible(false);
              }}
            >
              查看详情
            </Button>
          )
        ].filter(Boolean)}
        width={600}
      >
        {messageDetail && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag 
                color={messageTypeConfig[messageDetail.type].color} 
                icon={messageTypeConfig[messageDetail.type].icon}
              >
                {messageTypeConfig[messageDetail.type].label}
              </Tag>
              <Tag color={priorityConfig[messageDetail.priority].color}>
                {priorityConfig[messageDetail.priority].label}
              </Tag>
              <Badge 
                status={messageDetail.status === MessageStatus.UNREAD ? 'processing' : 'default'} 
                text={messageDetail.status === MessageStatus.UNREAD ? '未读' : '已读'} 
              />
            </Space>
            
            <Title level={4}>{messageDetail.title}</Title>
            
            <Paragraph>{messageDetail.content}</Paragraph>
            
            <Divider />
            
            <Text type="secondary">
              创建时间：{new Date(messageDetail.createdAt).toLocaleString()}
            </Text>
            
            {messageDetail.updatedAt !== messageDetail.createdAt && (
              <>
                <br />
                <Text type="secondary">
                  更新时间：{new Date(messageDetail.updatedAt).toLocaleString()}
                </Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;