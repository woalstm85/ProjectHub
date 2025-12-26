import React, { useState } from 'react';
import {
    Tabs,
    List,
    Button,
    Tag,
    Typography,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Checkbox,
    Card,
    Avatar,
    Badge,
    Empty,
    message as antMessage,
} from 'antd';
import {
    NotificationOutlined,
    MailOutlined,
    PlusOutlined,
    UserOutlined,
    SendOutlined,
    DeleteOutlined,
    PushpinFilled,
    ReadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNoticeStore, type Notice } from '../store/noticeStore';
import { useMessageStore, type Message } from '../store/messageStore';
import { useMemberStore } from '../store/memberStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Communication: React.FC = () => {
    const [activeTab, setActiveTab] = useState('notices');
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [messageForm] = Form.useForm();

    const { notices, addNotice, deleteNotice } = useNoticeStore();
    const { messages, sendMessage, markAsRead, deleteMessage } = useMessageStore();
    const { members } = useMemberStore();

    // Mock current user (assuming first member is logged in)
    const currentUser = members[0];

    // --- Notice Logic ---
    const handleNoticeSubmit = (values: any) => {
        addNotice({
            title: values.title,
            content: values.content,
            authorId: currentUser?.id || 'admin',
            authorName: currentUser?.name || '관리자',
            targetType: values.targetType,
            targetMemberIds: values.targetMemberIds,
            isImportant: values.isImportant || false,
        });
        setIsNoticeModalOpen(false);
        form.resetFields();
        antMessage.success('공지사항이 등록되었습니다.');
    };

    const sortedNotices = [...notices].sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // --- Message Logic ---
    const handleMessageSubmit = (values: any) => {
        const receiver = members.find((m) => m.id === values.receiverId);
        if (!receiver) return;

        sendMessage({
            senderId: currentUser?.id || 'unknown',
            senderName: currentUser?.name || '알 수 없음',
            receiverId: receiver.id,
            receiverName: receiver.name,
            content: values.content,
        });
        setIsMessageModalOpen(false);
        messageForm.resetFields();
        antMessage.success('쪽지를 보냈습니다.');
    };

    const myInbox = messages.filter((m) => m.receiverId === currentUser?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const myOutbox = messages.filter((m) => m.senderId === currentUser?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // --- Renderers ---
    const renderNoticeList = () => (
        <List
            itemLayout="vertical"
            dataSource={sortedNotices}
            renderItem={(item) => (
                <List.Item
                    key={item.id}
                    actions={[
                        <Text type="secondary">{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</Text>,
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteNotice(item.id)}>삭제</Button>
                    ]}
                    style={{ background: item.isImportant ? '#fffbe6' : 'transparent', padding: '16px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #f0f0f0' }}
                >
                    <List.Item.Meta
                        avatar={<Avatar icon={<NotificationOutlined />} style={{ backgroundColor: item.isImportant ? '#faad14' : '#1890ff' }} />}
                        title={
                            <Space>
                                {item.isImportant && <PushpinFilled style={{ color: '#faad14' }} />}
                                <Text strong>{item.title}</Text>
                                {item.targetType === 'SELECTED' && <Tag color="purple">일부 공개</Tag>}
                            </Space>
                        }
                        description={`작성자: ${item.authorName}`}
                    />
                    <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '더보기' }}>
                        {item.content}
                    </Paragraph>
                </List.Item>
            )}
        />
    );

    const renderMessageList = (data: Message[], type: 'inbox' | 'outbox') => (
        <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
                <List.Item
                    actions={[
                        <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.createdAt).format('MM-DD HH:mm')}</Text>,
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteMessage(item.id)} />
                    ]}
                    style={{
                        background: type === 'inbox' && !item.isRead ? '#e6f7ff' : 'transparent',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '4px'
                    }}
                    onClick={() => type === 'inbox' && !item.isRead && markAsRead(item.id)}
                >
                    <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={
                            <Space>
                                <Text strong>{type === 'inbox' ? `From: ${item.senderName}` : `To: ${item.receiverName}`}</Text>
                                {type === 'inbox' && !item.isRead && <Badge status="processing" text="안 읽음" />}
                            </Space>
                        }
                        description={item.content}
                    />
                </List.Item>
            )}
        />
    );

    return (
        <div className="communication-container">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{ marginBottom: 0 }}>커뮤니케이션</Title>
                <Space>
                    {activeTab === 'notices' ? (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsNoticeModalOpen(true)}>
                            공지사항 작성
                        </Button>
                    ) : (
                        <Button type="primary" icon={<SendOutlined />} onClick={() => setIsMessageModalOpen(true)}>
                            쪽지 보내기
                        </Button>
                    )}
                </Space>
            </div>

            <Card bordered={false} style={{ borderRadius: 12 }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'notices',
                            label: (
                                <span>
                                    <NotificationOutlined />
                                    공지사항
                                </span>
                            ),
                            children: notices.length > 0 ? renderNoticeList() : <Empty description="등록된 공지사항이 없습니다." />,
                        },
                        {
                            key: 'messages',
                            label: (
                                <span>
                                    <MailOutlined />
                                    쪽지함
                                </span>
                            ),
                            children: (
                                <Tabs
                                    type="card"
                                    items={[
                                        {
                                            key: 'inbox',
                                            label: `받은 쪽지함 (${myInbox.filter(m => !m.isRead).length})`,
                                            children: myInbox.length > 0 ? renderMessageList(myInbox, 'inbox') : <Empty description="받은 쪽지가 없습니다." />,
                                        },
                                        {
                                            key: 'outbox',
                                            label: '보낸 쪽지함',
                                            children: myOutbox.length > 0 ? renderMessageList(myOutbox, 'outbox') : <Empty description="보낸 쪽지가 없습니다." />,
                                        },
                                    ]}
                                />
                            ),
                        },
                    ]}
                />
            </Card>

            {/* Notice Modal */}
            <Modal
                title="공지사항 작성"
                open={isNoticeModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsNoticeModalOpen(false)}
                okText="등록"
                cancelText="취소"
            >
                <Form form={form} layout="vertical" onFinish={handleNoticeSubmit} initialValues={{ targetType: 'ALL', isImportant: false }}>
                    <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
                        <Input placeholder="공지 제목" />
                    </Form.Item>
                    <Form.Item name="targetType" label="공지 대상">
                        <Select>
                            <Select.Option value="ALL">전체 공개</Select.Option>
                            <Select.Option value="SELECTED">특정 멤버</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) => prev.targetType !== current.targetType}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('targetType') === 'SELECTED' ? (
                                <Form.Item name="targetMemberIds" label="멤버 선택" rules={[{ required: true, message: '멤버를 선택해주세요' }]}>
                                    <Select mode="multiple" placeholder="멤버를 선택하세요">
                                        {members.map((m) => (
                                            <Select.Option key={m.id} value={m.id}>
                                                {m.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item name="content" label="내용" rules={[{ required: true, message: '내용을 입력해주세요' }]}>
                        <TextArea rows={4} placeholder="공지 내용" />
                    </Form.Item>
                    <Form.Item name="isImportant" valuePropName="checked">
                        <Checkbox>중요 공지로 설정 (상단 고정)</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Message Modal */}
            <Modal
                title="쪽지 보내기"
                open={isMessageModalOpen}
                onOk={() => messageForm.submit()}
                onCancel={() => setIsMessageModalOpen(false)}
                okText="전송"
                cancelText="취소"
            >
                <Form form={messageForm} layout="vertical" onFinish={handleMessageSubmit}>
                    <Form.Item name="receiverId" label="받는 사람" rules={[{ required: true, message: '받는 사람을 선택해주세요' }]}>
                        <Select placeholder="멤버 선택">
                            {members.filter(m => m.id !== currentUser?.id).map((m) => (
                                <Select.Option key={m.id} value={m.id}>
                                    {m.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="content" label="내용" rules={[{ required: true, message: '내용을 입력해주세요' }]}>
                        <TextArea rows={4} placeholder="메시지 내용" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Communication;
