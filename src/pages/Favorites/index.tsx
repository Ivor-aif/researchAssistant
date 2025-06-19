import React, { useState, useEffect } from 'react';
import {
  Card,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  Tag,
  message,
  List,
  Button,
  Dropdown,
  Tooltip,
  Empty,
  Popconfirm
} from 'antd';
import {
  FolderOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SwapOutlined,
  BookOutlined
} from '@ant-design/icons';
import type { Paper } from '../../types/paper';
import type { FavoriteFolder, CreateFolderParams } from '../../types/favorite';
import {
  getFavoriteFolders,
  createFavoriteFolder,
  updateFavoriteFolder,
  deleteFavoriteFolder,
  removeFromFavorites,
  movePaperToFolder,
  getFolderStats
} from '../../services/favoriteService';
import './style.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface MovePaperModalProps {
  visible: boolean;
  currentFolderId: string;
  folders: FavoriteFolder[];
  onMove: (toFolderId: string) => void;
  onCancel: () => void;
}

const MovePaperModal: React.FC<MovePaperModalProps> = ({
  visible,
  currentFolderId,
  folders,
  onMove,
  onCancel
}) => {
  const availableFolders = folders.filter(f => f.id !== currentFolderId);

  return (
    <Modal
      title="移动论文"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
    >
      <div className="move-paper-content">
        <Text>将论文移动到：</Text>
        <div className="folder-list">
          {availableFolders.map(folder => (
            <Card
              key={folder.id}
              size="small"
              hoverable
              className="folder-card"
              onClick={() => onMove(folder.id)}
            >
              <Space>
                <FolderOutlined />
                <span>{folder.name}</span>
                <Tag color="blue">{folder.papers.length}</Tag>
              </Space>
            </Card>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const Favorites: React.FC = () => {
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FavoriteFolder | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载收藏夹列表
  const loadFolders = () => {
    const folderList = getFavoriteFolders();
    
    // 清理无效的论文数据
    const cleanedFolders = folderList.map(folder => ({
      ...folder,
      papers: folder.papers.filter(paper => paper && paper.id)
    }));
    
    console.log('加载的收藏夹数据:', cleanedFolders.map(f => ({
      id: f.id,
      name: f.name,
      paperCount: f.papers.length,
      papers: f.papers.map(p => ({ id: p.id, title: p.title }))
    })));
    
    setFolders(cleanedFolders);
    
    // 如果当前选中的收藏夹不存在，选择第一个
    if (selectedFolder && !cleanedFolders.find(f => f.id === selectedFolder.id)) {
      setSelectedFolder(cleanedFolders[0] || null);
    } else if (!selectedFolder && cleanedFolders.length > 0) {
      setSelectedFolder(cleanedFolders[0]);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  // 创建收藏夹
  const handleCreateFolder = async (values: CreateFolderParams) => {
    const newFolder = createFavoriteFolder(values);
    if (newFolder) {
      loadFolders();
      setCreateModalVisible(false);
      createForm.resetFields();
    }
  };

  // 更新收藏夹
  const handleUpdateFolder = async (values: any) => {
    if (!editingFolder) return;
    
    const success = updateFavoriteFolder({
      id: editingFolder.id,
      name: values.name,
      description: values.description
    });
    
    if (success) {
      loadFolders();
      setEditModalVisible(false);
      setEditingFolder(null);
      editForm.resetFields();
    }
  };

  // 删除收藏夹
  const handleDeleteFolder = (folder: FavoriteFolder) => {
    const success = deleteFavoriteFolder(folder.id);
    if (success) {
      loadFolders();
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(folders[0] || null);
      }
    }
  };

  // 移除论文
  const handleRemovePaper = (paperId: string) => {
    if (!selectedFolder) {
      message.error('请先选择收藏夹');
      return;
    }
    
    if (!paperId) {
      message.error('论文ID无效');
      return;
    }
    
    console.log('正在移除论文:', { paperId, folderId: selectedFolder.id, folderName: selectedFolder.name });
    
    const success = removeFromFavorites(paperId, selectedFolder.id);
    if (success) {
      // 立即更新本地状态
      const updatedFolder = {
        ...selectedFolder,
        papers: selectedFolder.papers.filter(paper => paper.id !== paperId)
      };
      setSelectedFolder(updatedFolder);
      
      // 重新加载所有收藏夹数据
      loadFolders();
      message.success('论文已从收藏夹中移除');
    } else {
      message.error('移除论文失败，请重试');
    }
  };

  // 移动论文
  const handleMovePaper = (toFolderId: string) => {
    if (!selectedPaper || !selectedFolder) return;
    
    const success = movePaperToFolder({
      paperId: selectedPaper.id,
      fromFolderId: selectedFolder.id,
      toFolderId
    });
    
    if (success) {
      loadFolders();
      setMoveModalVisible(false);
      setSelectedPaper(null);
    }
  };



  // 打开移动模态框
  const openMoveModal = (paper: Paper) => {
    setSelectedPaper(paper);
    setMoveModalVisible(true);
  };

  const stats = getFolderStats();

  return (
    <div className="favorites-page">
      <div className="page-header">
        <Title level={2}>我的收藏</Title>
        <Space>
          <Tag color="blue">共 {stats.totalFolders} 个收藏夹</Tag>
          <Tag color="green">共 {stats.totalPapers} 篇论文</Tag>
        </Space>
      </div>

      <div className="favorites-content">
        {/* 收藏夹列表 */}
        <div className="folders-sidebar">
          <div className="sidebar-header">
            <Title level={4}>收藏夹</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建
            </Button>
          </div>
          
          <List
            className="folder-list"
            dataSource={folders}
            renderItem={(folder) => (
              <List.Item
                className={`folder-item ${selectedFolder?.id === folder.id ? 'active' : ''}`}
                onClick={() => setSelectedFolder(folder)}
                actions={[
                  !folder.isDefault && (
                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: '编辑',
                            icon: <EditOutlined />,
                            onClick: () => {
                              setEditingFolder(folder);
                              editForm.setFieldsValue({
                                name: folder.name,
                                description: folder.description
                              });
                              setEditModalVisible(true);
                            }
                          },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => {
                              Modal.confirm({
                                title: '确认删除收藏夹',
                                content: (
                                  <div>
                                    <p>确定要删除收藏夹 <strong>"{folder.name}"</strong> 吗？</p>
                                    <p style={{ color: '#ff4d4f', marginBottom: 0 }}>
                                      ⚠️ 警告：删除收藏夹将会永久移除该收藏夹及其内部的所有 {folder.papers.length} 篇论文，此操作无法撤销！
                                    </p>
                                  </div>
                                ),
                                okText: '确认删除',
                                cancelText: '取消',
                                okType: 'danger',
                                onOk: () => handleDeleteFolder(folder)
                              });
                            }
                          }
                        ]
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      />
                    </Dropdown>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={<FolderOutlined />}
                  title={
                    <Space>
                      {folder.name}
                      {folder.isDefault && <Tag color="orange">默认</Tag>}
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">{folder.papers.length} 篇论文</Text>
                      {folder.description && (
                        <Tooltip title={folder.description}>
                          <Text type="secondary" ellipsis>• {folder.description}</Text>
                        </Tooltip>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        {/* 论文列表 */}
        <div className="papers-content">
          {selectedFolder ? (
            <>
              <div className="content-header">
                <Title level={3}>{selectedFolder.name}</Title>
                <Text type="secondary">
                  共 {selectedFolder.papers.length} 篇论文
                </Text>
              </div>
              
              {selectedFolder.papers.length > 0 ? (
                <List
                  className="paper-list"
                  dataSource={selectedFolder.papers}
                  renderItem={(paper) => (
                    <List.Item
                      actions={[
                        <Tooltip key="move" title="移动到其他收藏夹">
                          <Button
                            type="text"
                            icon={<SwapOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openMoveModal(paper);
                            }}
                            disabled={folders.length <= 1}
                          />
                        </Tooltip>,
                        <Popconfirm
                          key="remove"
                          title="确定要从收藏夹中移除这篇论文吗？"
                          onConfirm={() => {
                            console.log('点击删除按钮，论文信息:', { id: paper.id, title: paper.title });
                            handleRemovePaper(paper.id);
                          }}
                          placement="topRight"
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={!paper.id}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<BookOutlined />}
                        title={
                          <a href={paper.url} target="_blank" rel="noopener noreferrer">
                            {paper.title}
                          </a>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            {paper.authors && (
                              <Text type="secondary">
                                作者: {paper.authors.join(', ')}
                              </Text>
                            )}
                            {paper.journal && (
                              <Text type="secondary">
                                期刊: {paper.journal}
                              </Text>
                            )}
                            {paper.year && (
                              <Text type="secondary">
                                年份: {paper.year}
                              </Text>
                            )}
                            {paper.abstract && (
                              <Text type="secondary" ellipsis>
                                摘要: {paper.abstract}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无收藏的论文"
                />
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请选择一个收藏夹"
            />
          )}
        </div>
      </div>

      {/* 创建收藏夹模态框 */}
      <Modal
        title="创建收藏夹"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateFolder}
        >
          <Form.Item
            name="name"
            label="收藏夹名称"
            rules={[
              { required: true, message: '请输入收藏夹名称' },
              { max: 50, message: '名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入收藏夹名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述（可选）"
            rules={[
              { max: 200, message: '描述不能超过200个字符' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请输入收藏夹描述"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑收藏夹模态框 */}
      <Modal
        title="编辑收藏夹"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingFolder(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateFolder}
        >
          <Form.Item
            name="name"
            label="收藏夹名称"
            rules={[
              { required: true, message: '请输入收藏夹名称' },
              { max: 50, message: '名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入收藏夹名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述（可选）"
            rules={[
              { max: 200, message: '描述不能超过200个字符' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请输入收藏夹描述"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingFolder(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 移动论文模态框 */}
      <MovePaperModal
        visible={moveModalVisible}
        currentFolderId={selectedFolder?.id || ''}
        folders={folders}
        onMove={handleMovePaper}
        onCancel={() => {
          setMoveModalVisible(false);
          setSelectedPaper(null);
        }}
      />
    </div>
  );
};

export default Favorites;