import React, { useState } from 'react';
import {
    Layout,
    Card,
    Breadcrumb,
    Button,
    Input,
    Space,
    Table,
    Typography,
    Modal,
    Upload,
    message,
    Dropdown,
    Segmented,
    Empty,
    Tooltip
} from 'antd';
import {
    FolderOpenOutlined,
    FolderFilled,
    FileOutlined,
    FilePdfOutlined,
    FileImageOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    HomeOutlined,
    UploadOutlined,
    MoreOutlined,
    DeleteOutlined,
    AppstoreOutlined,
    BarsOutlined,
    SearchOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDriveStore, type DriveItem } from '../store/driveStore';
import { useSettings } from '../store/settingsStore';

const { Content } = Layout;
const { Text } = Typography;

const Drive: React.FC = () => {
    const { items, createFolder, uploadFile, deleteItem, getItemsByParentId } = useDriveStore();
    const { effectiveTheme } = useSettings();
    const isDark = effectiveTheme === 'dark';

    // State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Derived Data
    const currentFolder = items.find(i => i.id === currentFolderId);

    // Breadcrumb Logic
    const getBreadcrumbs = () => {
        const crumbs = [{ title: <HomeOutlined onClick={() => setCurrentFolderId(null)} />, key: 'root' }];
        if (!currentFolderId) return crumbs;

        const path: DriveItem[] = [];
        let curr = items.find(i => i.id === currentFolderId);

        while (curr) {
            path.unshift(curr);
            curr = items.find(i => i.id === curr?.parentId);
        }

        path.forEach(item => {
            crumbs.push({
                title: <span onClick={() => setCurrentFolderId(item.id)} style={{ cursor: 'pointer' }}>{item.name}</span>,
                key: item.id
            });
        });

        return crumbs;
    };

    // Filter Logic
    const currentItems = currentFolderId
        ? getItemsByParentId(currentFolderId)
        : items.filter(i => i.parentId === null);

    const filteredItems = currentItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helpers
    const getFileIcon = (item: DriveItem) => {
        if (item.type === 'FOLDER') return <FolderFilled style={{ color: '#faad14', fontSize: 24 }} />;
        const ext = item.format?.toLowerCase();
        if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
        if (['jpg', 'png', 'jpeg'].includes(ext || '')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
        if (['doc', 'docx'].includes(ext || '')) return <FileWordOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
        if (['xls', 'xlsx'].includes(ext || '')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
        return <FileOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '-';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Handlers
    const handleFolderClick = (item: DriveItem) => {
        if (item.type === 'FOLDER') {
            setCurrentFolderId(item.id);
        } else if (item.type === 'FILE') {
            const fileUrl = `http://localhost:3001/files/${item.name}`;
            window.open(fileUrl, '_blank');
        }
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolder(newFolderName, currentFolderId);
        setNewFolderName('');
        setIsCreateFolderModalOpen(false);
        message.success('폴더가 생성되었습니다.');
    };

    const handleUpload = (file: File) => {
        uploadFile(file, currentFolderId);
        message.success(`${file.name} 업로드 완료`);
        return false; // Prevent auto upload
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: '삭제 확인',
            content: '정말로 삭제하시겠습니까? 폴더의 경우 내부 파일도 모두 삭제됩니다.',
            okType: 'danger',
            onOk: () => {
                deleteItem(id);
                message.success('삭제되었습니다.');
            }
        });
    };

    const handleGoUp = () => {
        if (currentFolder) {
            setCurrentFolderId(currentFolder.parentId);
        }
    };

    // Columns for List View
    const columns = [
        {
            title: '이름',
            key: 'name',
            render: (_: any, record: DriveItem) => (
                <Space style={{ cursor: 'pointer' }} onClick={() => handleFolderClick(record)}>
                    {getFileIcon(record)}
                    <Text strong={record.type === 'FOLDER'}>{record.name}</Text>
                </Space>
            ),
            sorter: (a: DriveItem, b: DriveItem) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
        },
        {
            title: '크기',
            dataIndex: 'size',
            key: 'size',
            render: (size: number) => formatSize(size),
            width: 120,
        },
        {
            title: '소유자',
            dataIndex: 'ownerName',
            key: 'ownerName',
            width: 120,
        },
        {
            title: '수정일',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
            width: 120,
        },
        {
            title: '',
            key: 'action',
            width: 60,
            render: (_: any, record: DriveItem) => (
                <Dropdown menu={{
                    items: [
                        { key: 'delete', label: '삭제', icon: <DeleteOutlined />, danger: true, onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(record.id); } }
                    ]
                }} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                </Dropdown>
            )
        }
    ];

    return (
        <Layout style={{ height: 'calc(100vh - 120px)', background: 'transparent' }}>
            <Content style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Space size="middle">
                        <Button icon={<ArrowUpOutlined />} disabled={!currentFolderId} onClick={handleGoUp}>상위로</Button>
                        <Breadcrumb items={getBreadcrumbs()} separator=">" style={{ fontSize: 16 }} />
                    </Space>
                    <Space>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Segmented
                            options={[
                                { value: 'Grid', icon: <AppstoreOutlined /> },
                                { value: 'List', icon: <BarsOutlined /> },
                            ]}
                            value={viewMode}
                            onChange={(val) => setViewMode(val as 'Grid' | 'List')}
                        />
                        <Button icon={<FolderOpenOutlined />} onClick={() => setIsCreateFolderModalOpen(true)}>새 폴더</Button>
                        <Upload showUploadList={false} beforeUpload={handleUpload as any}>
                            <Button type="primary" icon={<UploadOutlined />}>업로드</Button>
                        </Upload>
                    </Space>
                </div>

                <div
                    style={{
                        background: isDark ? '#1f1f1f' : '#ffffff',
                        padding: 24,
                        borderRadius: 12,
                        minHeight: '100%',
                        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
                        border: isDark ? '1px solid #303030' : '1px solid #e0e0e0'
                    }}
                >
                    {filteredItems.length === 0 ? (
                        <Empty description="폴더가 비어있습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : viewMode === 'List' ? (
                        <Table
                            dataSource={filteredItems}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            onRow={(record) => ({
                                onDoubleClick: () => handleFolderClick(record),
                            })}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                            {filteredItems.map(item => (
                                <Card
                                    key={item.id}
                                    hoverable
                                    style={{
                                        width: 160,
                                        textAlign: 'center',
                                        borderRadius: 12,
                                        border: isDark ? '1px solid #303030' : '1px solid #e0e0e0',
                                        background: isDark ? '#2a2a2a' : '#ffffff'
                                    }}
                                    bodyStyle={{ padding: 16 }}
                                    onClick={() => handleFolderClick(item)}
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        {getFileIcon(item)}
                                    </div>
                                    <Tooltip title={item.name}>
                                        <Text
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                fontSize: 13,
                                                lineHeight: '1.4',
                                                height: '2.8em' // approx 2 lines
                                            }}
                                        >
                                            {item.name}
                                        </Text>
                                    </Tooltip>
                                    <div style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                    }}>
                                        <Dropdown menu={{
                                            items: [
                                                { key: 'delete', label: '삭제', icon: <DeleteOutlined />, danger: true, onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(item.id); } }
                                            ]
                                        }} trigger={['click']}>
                                            <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer', padding: 4 }}>
                                                <MoreOutlined style={{ fontSize: 16, color: '#bfbfbf' }} />
                                            </div>
                                        </Dropdown>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Content>

            <Modal
                title="새 폴더 만들기"
                open={isCreateFolderModalOpen}
                onOk={handleCreateFolder}
                onCancel={() => setIsCreateFolderModalOpen(false)}
            >
                <Input
                    placeholder="폴더 이름"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={handleCreateFolder}
                    autoFocus
                />
            </Modal>
        </Layout>
    );
};

export default Drive;
