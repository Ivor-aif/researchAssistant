import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Dropdown,
  Space,
  Typography,
  Tag,
  Tooltip,
  Empty,
  Popconfirm,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  HeartOutlined,
  MoreOutlined,
  SwapOutlined,
  BookOutlined
} from '@ant-design/icons';
import type { Paper } from '../../types/paper';
import type { FavoriteFolder, CreateFolderParams, UpdateFolderParams } from '../../types/favorite';
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

const { Title, Text } = Typography;
const { TextArea } = Input;

interface MovePaperModalProps {
  visible: boolean;
  paper: Paper | null;
  currentFolderId: string;
  folders: FavoriteFolder[];
  onMove: (toFolderId: string) => void;
  onCancel: () => void;
}

const MovePaperModal: React.FC<MovePaperModalProps> = ({
  visible,
  paper,
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

  // 加载收藏夹数据
  const loadFolders = () => {
    const folderList = getFavoriteFolders();
    setFolders(folderList);
    if (!selectedFolder && folderList.length > 0) {
      setSelectedFolder(folderList[0]);
    } else if (selectedFolder) {
      // 更新当前选中的收藏夹数据
      const updatedFolder = folderList.find(f => f.id === selectedFolder.id);
      setSelectedFolder(updatedFolder || folderList[0]);
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
    if (!selectedFolder) return;
    
    const success = removeFromFavorites(paperId, selectedFolder.id);
    if (success) {
      loadFolders();
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

  // 打开编辑模态框
  const openEditModal = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    editForm.setFieldsValue({
      name: folder.name,
      description: folder.description
    });
    setEditModalVisible(true);
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
                      key="more"
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: '编辑',
                            icon: <EditOutlined />,
                            onClick: () => openEditModal(folder)
                          },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => {
                              Modal.confirm({
                                title: '确认删除',
                                content: `确定要删除收藏夹"${folder.name}"吗？`,
                                onOk: () => handleDeleteFolder(folder)
                              });
                            }
                          }
                        ]
                      }}
                      trigger={['click']}
                    >
                      <Button type="text" icon={<MoreOutlined />} />
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
                            onClick={() => openMoveModal(paper)}
                            disabled={folders.length <= 1}
                          />
                        </Tooltip>,
                        <Popconfirm
                          key="remove"
                          title="确定要从收藏夹中移除这篇论文吗？"
                          onConfirm={() => handleRemovePaper(paper.id)}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
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
        paper={selectedPaper}
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