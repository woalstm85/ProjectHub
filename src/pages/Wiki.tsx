import React, { useState } from 'react';
import {
    Layout,
    Card,
    List,
    Typography,
    Input,
    Button,
    Tag,
    Space,
    Divider,
    Form,
    Select,
    message,
    Modal,
    Breadcrumb
} from 'antd';
import {
    ReadOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
    SaveOutlined,
    FileTextOutlined,
    BookOutlined,
    CodeOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useWikiStore, type WikiPage, type WikiCategory } from '../store/wikiStore';
import { useAuthStore } from '../store/authStore';

const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;
const { TextArea } = Input;

const Wiki: React.FC = () => {
    const { pages, addPage, updatePage, deletePage } = useWikiStore();
    const { user } = useAuthStore();

    // States
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'ALL'>('ALL');
    const [form] = Form.useForm();

    const selectedPage = pages.find(p => p.id === selectedPageId);

    // Filters
    const filteredPages = pages.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Handlers
    const handleSelectPage = (id: string) => {
        if (isEditing || isCreating) {
            Modal.confirm({
                title: '저장되지 않은 변경사항',
                content: '작성 중인 내용이 있습니다. 정말 이동하시겠습니까?',
                onOk: () => {
                    setSelectedPageId(id);
                    setIsEditing(false);
                    setIsCreating(false);
                    form.resetFields();
                }
            });
        } else {
            setSelectedPageId(id);
        }
    };

    const handleCreateClick = () => {
        setSelectedPageId(null);
        setIsCreating(true);
        setIsEditing(false);
        form.resetFields();
    };

    const handleEditClick = () => {
        if (selectedPage) {
            form.setFieldsValue({
                title: selectedPage.title,
                category: selectedPage.category,
                content: selectedPage.content
            });
            setIsEditing(true);
        }
    };

    const handleDeleteClick = () => {
        if (selectedPage) {
            Modal.confirm({
                title: '문서 삭제',
                content: '정말로 이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                okType: 'danger',
                onOk: () => {
                    deletePage(selectedPage.id);
                    setSelectedPageId(null);
                    message.success('문서가 삭제되었습니다.');
                }
            });
        }
    };

    const handleSave = (values: any) => {
        if (!user) return;

        if (isCreating) {
            addPage({
                title: values.title,
                content: values.content,
                category: values.category,
                parentId: null,
                authorId: user.id,
                authorName: user.name,
            });
            message.success('새 문서가 생성되었습니다.');
            setIsCreating(false);
            // Select the newly created page (logic simplified, could pick top of list or return ID)
            // For now, just reset interaction
        } else if (isEditing && selectedPageId) {
            updatePage(selectedPageId, {
                title: values.title,
                content: values.content,
                category: values.category,
            });
            message.success('문서가 수정되었습니다.');
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setIsEditing(false);
        form.resetFields();
    };

    // Category Config
    const getCategoryConfig = (category: WikiCategory) => {
        switch (category) {
            case 'GENERAL': return { icon: <GlobalOutlined />, color: 'blue', label: '일반' };
            case 'TECHNICAL': return { icon: <CodeOutlined />, color: 'purple', label: '기술' };
            case 'PROCESS': return { icon: <BookOutlined />, color: 'orange', label: '프로세스' };
            case 'ONBOARDING': return { icon: <SafetyCertificateOutlined />, color: 'green', label: '온보딩' };
            default: return { icon: <FileTextOutlined />, color: 'default', label: '기타' };
        }
    };

    return (
        <Layout style={{ height: 'calc(100vh - 120px)', background: 'transparent' }}>
            <Sider width={320} style={{ background: 'transparent', borderRight: '1px solid #f0f0f0', paddingRight: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Button type="primary" block icon={<PlusOutlined />} size="large" onClick={handleCreateClick}>
                            새 문서 작성
                        </Button>
                    </div>

                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="문서 검색..."
                        style={{ marginBottom: 16 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag.CheckableTag checked={selectedCategory === 'ALL'} onChange={() => setSelectedCategory('ALL')}>전체</Tag.CheckableTag>
                        {(['GENERAL', 'TECHNICAL', 'PROCESS', 'ONBOARDING'] as WikiCategory[]).map(cat => (
                            <Tag.CheckableTag
                                key={cat}
                                checked={selectedCategory === cat}
                                onChange={() => setSelectedCategory(cat)}
                            >
                                {getCategoryConfig(cat).label}
                            </Tag.CheckableTag>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <List
                            dataSource={filteredPages}
                            renderItem={item => (
                                <List.Item
                                    onClick={() => handleSelectPage(item.id)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: selectedPageId === item.id ? '#e6f7ff' : 'transparent',
                                        border: selectedPageId === item.id ? '1px solid #1890ff' : '1px solid transparent',
                                        marginBottom: 8,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                <Tag color={getCategoryConfig(item.category).color} style={{ marginRight: 0 }}>
                                                    {getCategoryConfig(item.category).label}
                                                </Tag>
                                                <Text strong={selectedPageId === item.id}>{item.title}</Text>
                                            </Space>
                                        }
                                        description={
                                            <div style={{ fontSize: 11, marginTop: 4 }}>
                                                <Text type="secondary">{dayjs(item.updatedAt).format('YYYY-MM-DD')} · {item.authorName}</Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            </Sider>

            <Content style={{ paddingLeft: 24, overflowY: 'auto' }}>
                <Card style={{ minHeight: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {isCreating || isEditing ? (
                        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ category: 'GENERAL' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <Title level={4}>{isCreating ? '새 문서 작성' : '문서 편집'}</Title>
                                <Space>
                                    <Button onClick={handleCancel}>취소</Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>저장</Button>
                                </Space>
                            </div>

                            <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
                                <Input size="large" placeholder="문서 제목을 입력하세요" />
                            </Form.Item>

                            <Form.Item name="category" label="카테고리" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Select.Option value="ONBOARDING">온보딩</Select.Option>
                                    <Select.Option value="TECHNICAL">기술/개발</Select.Option>
                                    <Select.Option value="PROCESS">업무 프로세스</Select.Option>
                                    <Select.Option value="GENERAL">일반</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="content" label="내용" rules={[{ required: true, message: '내용을 입력해주세요' }]}>
                                <TextArea
                                    rows={20}
                                    placeholder="# 여기에 내용을 작성하세요 (Markdown 지원 예정)"
                                    style={{ fontFamily: 'monospace', fontSize: 14 }}
                                />
                            </Form.Item>
                        </Form>
                    ) : selectedPage ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <Space style={{ marginBottom: 8 }}>
                                        <Breadcrumb items={[{ title: 'Wiki' }, { title: getCategoryConfig(selectedPage.category).label }]} />
                                    </Space>
                                    <Title level={2} style={{ margin: '8px 0' }}>{selectedPage.title}</Title>
                                    <Space size="large" style={{ color: '#8c8c8c' }}>
                                        <span><EditOutlined /> 작성자: {selectedPage.authorName}</span>
                                        <span><ClockCircleOutlined /> 최종 수정: {dayjs(selectedPage.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                                    </Space>
                                </div>
                                <Space>
                                    <Button icon={<EditOutlined />} onClick={handleEditClick}>편집</Button>
                                    <Button icon={<DeleteOutlined />} danger onClick={handleDeleteClick}>삭제</Button>
                                </Space>
                            </div>

                            <Divider />

                            <div style={{ minHeight: 400 }}>
                                <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>
                                    {selectedPage.content}
                                </Paragraph>
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#bfbfbf' }}>
                            <ReadOutlined style={{ fontSize: 64, marginBottom: 24, opacity: 0.5 }} />
                            <Title level={4} style={{ color: '#bfbfbf' }}>문서를 선택하거나 새로 작성하세요</Title>
                            <Text type="secondary">팀의 지식을 공유하고 자산화하세요.</Text>
                        </div>
                    )}
                </Card>
            </Content>
        </Layout>
    );
};

export default Wiki;
