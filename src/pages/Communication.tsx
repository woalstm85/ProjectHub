import React, { useState, useMemo } from 'react';
import {
    Layout,
    Menu,
    List,
    Avatar,
    Typography,
    Space,
    Input,
    Button,
    Badge,
    Tag,
    Card,
    Dropdown,
    Empty,
} from 'antd';
import {
    NotificationOutlined,
    ProjectOutlined,
    UserOutlined,
    SendOutlined,
    FileTextOutlined,
    SoundOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNoticeStore } from '../store/noticeStore';
import { useMessageStore, type Message, type MessageType } from '../store/messageStore';
import { useMemberStore } from '../store/memberStore';
import { useProjectStore, IndustryType } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { useSettings } from '../store/settingsStore';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// 산업별 메시지 템플릿
const INDUSTRY_TEMPLATES = {
    [IndustryType.SOFTWARE]: [
        { id: 'sw-1', title: '스펙 변경 알림', content: '기획 변경으로 인해 [모듈명]의 스펙이 업데이트되었습니다.' },
        { id: 'sw-2', title: '배포 요청', content: '현재 [브랜치명] 작업 완료되었습니다. 스테이징 배포 부탁드립니다.' },
        { id: 'sw-3', title: '긴급 버그 공유', content: '운영 환경에서 [현상] 문제가 발생했습니다. 즉시 확인이 필요합니다.' },
    ],
    [IndustryType.MANUFACTURING]: [
        { id: 'mf-1', title: '설비 이상 감지', content: '[설비명]에서 비정상 소음 및 진동이 감지되었습니다. 긴급 점검 요청합니다.' },
        { id: 'mf-2', title: '원자재 부족 알림', content: '[자재명]의 재고가 임계치 미만입니다. 추가 발주가 필요합니다.' },
        { id: 'mf-3', title: '안전 수칙 준수', content: '현재 [공정] 구역 작업 시 보호구 착용 상태를 다시 한번 확인해 주세요.' },
    ],
    [IndustryType.SERVICE]: [
        { id: 'sv-1', title: 'SLA 경고', content: '[고객사] 응대 시한(SLA)이 30분 남았습니다. 빠른 처리 부탁드립니다.' },
        { id: 'sv-2', title: 'VOC 공유', content: '최근 [이슈명] 관련 고객 불만이 급증하고 있습니다. 대응 가이드 확인 바랍니다.' },
    ],
    [IndustryType.GENERAL]: [
        { id: 'ge-1', title: '회의 요청', content: '[일시]에 [안건] 관련하여 짧은 싱크업 회의를 요청합니다.' },
        { id: 'ge-2', title: '지출결의 알림', content: '[항목] 관련 지출결의안을 상신했습니다. 결재 검토 부탁드립니다.' },
    ],
};

const Communication: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const { projects } = useProjectStore();
    const { members } = useMemberStore();
    const { notices } = useNoticeStore();
    const { messages, sendMessage } = useMessageStore();
    const { effectiveTheme } = useSettings();
    const isDark = effectiveTheme === 'dark';

    const [selectedType, setSelectedType] = useState<MessageType | 'NOTICE'>('NOTICE');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');

    // --- Data Preparation ---
    const myProjects = projects.filter(p => !currentUser || p.teamMembers.includes(currentUser.id));
    const activeProject = projects.find(p => p.id === selectedId);
    const activeMember = members.find(m => m.id === selectedId);

    const filteredMessages = useMemo(() => {
        if (selectedType === 'CHANNEL') {
            return messages.filter(m => m.projectId === selectedId).reverse();
        }
        if (selectedType === 'DIRECT') {
            return messages.filter(m =>
                (m.senderId === currentUser?.id && m.receiverId === selectedId) ||
                (m.senderId === selectedId && m.receiverId === currentUser?.id)
            ).reverse();
        }
        return [];
    }, [messages, selectedType, selectedId, currentUser]);

    // --- Handlers ---
    const handleSend = (text: string = messageInput) => {
        if (!text.trim() || !selectedId || !currentUser) return;

        sendMessage({
            type: selectedType === 'CHANNEL' ? 'CHANNEL' : 'DIRECT',
            senderId: currentUser.id,
            senderName: currentUser.name,
            projectId: selectedType === 'CHANNEL' ? selectedId : undefined,
            receiverId: selectedType === 'DIRECT' ? selectedId : undefined,
            receiverName: selectedType === 'DIRECT' ? activeMember?.name : undefined,
            content: text,
        });
        setMessageInput('');
    };

    const applyTemplate = (templateContent: string) => {
        setMessageInput(templateContent);
    };

    // --- Renderers ---
    const renderSidebar = () => (
        <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <Menu
                mode="inline"
                selectedKeys={[selectedId || 'notice-list']}
                style={{ height: '100%', borderRight: 0 }}
                onSelect={({ key }) => {
                    if (key === 'notice-list') {
                        setSelectedType('NOTICE');
                        setSelectedId(null);
                    } else if (key.startsWith('p-')) {
                        setSelectedType('CHANNEL');
                        setSelectedId(key.replace('p-', ''));
                    } else if (key.startsWith('m-')) {
                        setSelectedType('DIRECT');
                        setSelectedId(key.replace('m-', ''));
                    }
                }}
            >
                <Menu.Item key="notice-list" icon={<NotificationOutlined />}>전체 공지사항</Menu.Item>

                <Menu.ItemGroup key="channels" title="프로젝트 채널">
                    {myProjects.map(p => (
                        <Menu.Item key={`p-${p.id}`} icon={<ProjectOutlined />}>
                            {p.name}
                        </Menu.Item>
                    ))}
                </Menu.ItemGroup>

                <Menu.ItemGroup key="members" title="다이렉트 메시지">
                    {members.filter(m => m.id !== currentUser?.id).map(m => (
                        <Menu.Item key={`m-${m.id}`} icon={<Avatar size="small" src={m.avatar} icon={<UserOutlined />} style={{ marginRight: 8 }} />}>
                            {m.name}
                        </Menu.Item>
                    ))}
                </Menu.ItemGroup>
            </Menu>
        </Sider>
    );

    const renderChatHeader = () => {
        let title = "커뮤니케이션 허브";
        let subTitle = "원활한 협업을 위한 메시징 센터";
        let extraInfo = null;

        if (selectedType === 'NOTICE') {
            title = "전체 공지사항";
        } else if (selectedType === 'CHANNEL' && activeProject) {
            title = activeProject.name;
            subTitle = activeProject.description;
            extraInfo = <Tag color="blue">{activeProject.industry}</Tag>;
        } else if (selectedType === 'DIRECT' && activeMember) {
            title = activeMember.name;
            subTitle = activeMember.role;
        }

        return (
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '12px 12px 0 0' }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>{title}</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>{subTitle}</Text>
                </div>
                {extraInfo}
            </div>
        );
    };

    const renderNoticeFeed = () => (
        <div style={{ padding: 24 }}>
            <List
                dataSource={[...notices].sort((a, b) => (a.isImportant === b.isImportant ? 0 : a.isImportant ? -1 : 1))}
                renderItem={item => (
                    <Card style={{
                        marginBottom: 12,
                        borderRadius: 12,
                        border: item.isImportant ? '1px solid #faad14' : (isDark ? '1px solid #303030' : '1px solid #e0e0e0'),
                        background: item.isImportant ? (isDark ? '#433610' : '#fffbe6') : (isDark ? '#1f1f1f' : '#ffffff'),
                        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)'
                    }}>
                        <Space align="start" style={{ width: '100%' }}>
                            <Avatar size="large" icon={item.isImportant ? <SoundOutlined /> : <NotificationOutlined />} style={{ backgroundColor: item.isImportant ? '#faad14' : '#1890ff' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.createdAt).format('YYYY-MM-DD')}</Text>
                                </div>
                                <Paragraph style={{ marginTop: 8 }}>{item.content}</Paragraph>
                                <Space size={[0, 4]} wrap>
                                    <Tag icon={<UserOutlined />}>{item.authorName}</Tag>
                                    {item.isImportant && <Tag color="warning">중요</Tag>}
                                </Space>
                            </div>
                        </Space>
                    </Card>
                )}
            />
        </div>
    );

    const renderMessageFeed = () => (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column-reverse' }}>
            {filteredMessages.length > 0 ? (
                <List
                    dataSource={filteredMessages}
                    renderItem={(msg: Message) => {
                        const isMine = msg.senderId === currentUser?.id;
                        return (
                            <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', maxWidth: '70%', alignItems: 'flex-start' }}>
                                    {!isMine && <Avatar size="small" icon={<UserOutlined />} style={{ marginTop: 4, flexShrink: 0 }} />}
                                    <div style={{ margin: isMine ? '0 12px 0 0' : '0 0 0 12px' }}>
                                        {!isMine && <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{msg.senderName}</div>}
                                        <div style={{
                                            background: isMine ? '#1890ff' : '#f5f5f5',
                                            color: isMine ? '#fff' : '#262626',
                                            padding: '8px 16px',
                                            borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                                            {dayjs(msg.createdAt).format('HH:mm')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            ) : (
                <Empty description="메시지가 없습니다. 대화를 시작해 보세요!" style={{ margin: 'auto' }} />
            )}
        </div>
    );

    const renderMessageInput = () => {
        const templates = (activeProject ? INDUSTRY_TEMPLATES[activeProject.industry] : null) || INDUSTRY_TEMPLATES[IndustryType.GENERAL];

        const templateItems = templates.map(t => ({
            key: t.id,
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{t.content.substring(0, 20)}...</div>
                    </div>
                </div>
            ),
            onClick: () => applyTemplate(t.content)
        }));

        return (
            <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #f0f0f0', borderRadius: '0 0 12px 12px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <Dropdown menu={{ items: templateItems }} placement="topLeft">
                        <Button icon={<ThunderboltOutlined />} type="dashed" shape="circle" size="large" />
                    </Dropdown>
                    <Input.TextArea
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        placeholder="메시지를 입력하세요 (Shift + Enter로 전송)"
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        style={{ borderRadius: 12 }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        shape="circle"
                        size="large"
                        onClick={() => handleSend()}
                        disabled={!messageInput.trim()}
                    />
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                    <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 11 }}>팀원들과 실시간으로 소통하세요.</Text>} />
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '0 0 24px 0', height: '100%', minHeight: '600px' }}>
            <Layout style={{ background: 'transparent' }}>
                {renderSidebar()}
                <Content style={{ padding: '0 0 0 24px', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bordered={false}
                        style={{
                            height: 'calc(100vh - 120px)',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 12,
                            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
                            border: isDark ? '1px solid #303030' : '1px solid #e0e0e0',
                            background: isDark ? '#1f1f1f' : '#ffffff'
                        }}
                        bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}
                    >
                        {renderChatHeader()}

                        {selectedType === 'NOTICE' ? (
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {renderNoticeFeed()}
                            </div>
                        ) : (
                            <>
                                {renderMessageFeed()}
                                {renderMessageInput()}
                            </>
                        )}
                    </Card>
                </Content>
            </Layout>
        </div>
    );
};

export default Communication;
