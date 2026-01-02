import React, { useState } from 'react';
import {
    Card,
    Tabs,
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    Badge,
    Descriptions,
    Empty,
    message,
    Avatar,
    Divider,
} from 'antd';
import {
    FileDoneOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    UserOutlined,
    ProfileOutlined,
    SafetyCertificateOutlined,
    DollarCircleOutlined,
    RocketOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useApprovalStore, type Approval, type ApprovalStatus, type ApprovalType } from '../store/approvalStore';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Approvals: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const { approvals, requestApproval, processApproval } = useApprovalStore();
    const { projects } = useProjectStore();
    const { members } = useMemberStore();
    const { effectiveTheme } = useSettings();
    const isDark = effectiveTheme === 'dark';

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [rejectForm] = Form.useForm();

    // --- Data Filtering ---
    const myRequests = approvals.filter(a => a.requesterId === currentUser?.id);
    const pendingForMe = approvals.filter(a => a.approverId === currentUser?.id && a.status === 'PENDING');
    const handledByMe = approvals.filter(a => a.approverId === currentUser?.id && a.status !== 'PENDING');

    // --- Helpers ---
    const getStatusConfig = (status: ApprovalStatus) => {
        switch (status) {
            case 'PENDING': return { color: 'processing', text: '대기중', icon: <ClockCircleOutlined /> };
            case 'APPROVED': return { color: 'success', text: '승인됨', icon: <CheckCircleOutlined /> };
            case 'REJECTED': return { color: 'error', text: '반려됨', icon: <CloseCircleOutlined /> };
            case 'CANCELLED': return { color: 'default', text: '취소됨', icon: <ClockCircleOutlined /> };
        }
    };

    const getTypeConfig = (type: ApprovalType) => {
        switch (type) {
            case 'ISSUE_RESOLUTION': return { icon: <ProfileOutlined />, label: '이슈 해결', color: 'orange' };
            case 'BUDGET': return { icon: <DollarCircleOutlined />, label: '예산 집행', color: 'green' };
            case 'QUALITY_CHECK': return { icon: <SafetyCertificateOutlined />, label: '품질 검사', color: 'purple' };
            case 'RELEASE': return { icon: <RocketOutlined />, label: '배포/출시', color: 'cyan' };
            case 'GENERAL': return { icon: <FileDoneOutlined />, label: '일반 결재', color: 'blue' };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'red';
            case 'HIGH': return 'volcano';
            case 'MEDIUM': return 'blue';
            case 'LOW': return 'green';
            default: return 'default';
        }
    };

    // --- Handlers ---
    const handleRequestSubmit = (values: any) => {
        if (!currentUser) return;

        const project = projects.find(p => p.id === values.projectId);
        const approver = members.find(m => m.id === values.approverId);

        requestApproval({
            title: values.title,
            type: values.type,
            priority: values.priority,
            requesterId: currentUser.id,
            requesterName: currentUser.name,
            approverId: values.approverId,
            approverName: approver?.name || '알 수 없음',
            projectId: values.projectId,
            projectName: project?.name || '알 수 없음',
            content: values.content,
        });

        setIsRequestModalOpen(false);
        form.resetFields();
        message.success('결재 요청이 전송되었습니다.');
    };

    const handleAction = (status: 'APPROVED' | 'REJECTED', reason?: string) => {
        if (!selectedApproval) return;
        processApproval(selectedApproval.id, status, reason);
        setIsRejectModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedApproval(null);
        message.success(`결재가 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다.`);
    };

    // --- Table Columns ---
    const columns = [
        {
            title: '결재 제목',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Approval) => (
                <Space>
                    <Badge color={getTypeConfig(record.type).color} />
                    <Text strong onClick={() => { setSelectedApproval(record); setIsDetailModalOpen(true); }} style={{ cursor: 'pointer' }}>
                        {text}
                    </Text>
                </Space>
            ),
        },
        {
            title: '구분',
            dataIndex: 'type',
            key: 'type',
            render: (type: ApprovalType) => {
                const config = getTypeConfig(type);
                return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: '중요도',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
        },
        {
            title: '요청자',
            dataIndex: 'requesterName',
            key: 'requesterName',
            render: (text: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {text}
                </Space>
            ),
        },
        {
            title: '승인자',
            dataIndex: 'approverName',
            key: 'approverName',
        },
        {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (status: ApprovalStatus) => {
                const config = getStatusConfig(status);
                return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
            },
        },
        {
            title: '날짜',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
        },
    ];

    return (
        <div style={{ padding: '0 0 24px 0' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>전자결재</Title>
                    <Text type="secondary">업무 승인 및 의사결정을 위한 전문 시스템</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsRequestModalOpen(true)}>
                    새 결재 요청
                </Button>
            </div>

            <Card bordered={false} style={{
                borderRadius: 12,
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
                border: isDark ? '1px solid #303030' : '1px solid #e0e0e0',
                background: isDark ? '#1f1f1f' : '#ffffff'
            }}>
                <Tabs
                    items={[
                        {
                            key: 'pending',
                            label: (
                                <Badge count={pendingForMe.length} offset={[10, 0]}>
                                    <span style={{ paddingRight: 8 }}>내게 온 결재</span>
                                </Badge>
                            ),
                            children: (
                                <Table
                                    columns={columns}
                                    dataSource={pendingForMe}
                                    rowKey="id"
                                    locale={{ emptyText: <Empty description="대기 중인 결재가 없습니다." /> }}
                                />
                            ),
                        },
                        {
                            key: 'myRequests',
                            label: '내 요청함',
                            children: (
                                <Table
                                    columns={columns}
                                    dataSource={myRequests}
                                    rowKey="id"
                                />
                            ),
                        },
                        {
                            key: 'completed',
                            label: '처리 완료함',
                            children: (
                                <Table
                                    columns={columns}
                                    dataSource={handledByMe}
                                    rowKey="id"
                                />
                            ),
                        },
                    ]}
                />
            </Card>

            {/* Request Modal */}
            <Modal
                title="새 결재 요청"
                open={isRequestModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsRequestModalOpen(false)}
                okText="요청"
                cancelText="취소"
                width={650}
            >
                <Form form={form} layout="vertical" onFinish={handleRequestSubmit} initialValues={{ type: 'GENERAL', priority: 'MEDIUM' }}>
                    <Form.Item name="title" label="결재 서류 제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
                        <Input placeholder="예: [안전진단] 설비 재가동 승인 요청" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="type" label="결재 구분" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="ISSUE_RESOLUTION">이슈 해결</Select.Option>
                                <Select.Option value="BUDGET">예산 집행</Select.Option>
                                <Select.Option value="QUALITY_CHECK">품질 검사</Select.Option>
                                <Select.Option value="RELEASE">배포/출시</Select.Option>
                                <Select.Option value="GENERAL">일반 결재</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="priority" label="중요도" rules={[{ required: true }]}>
                            <Select>
                                <Select.Option value="URGENT">긴급 (URGENT)</Select.Option>
                                <Select.Option value="HIGH">높음 (HIGH)</Select.Option>
                                <Select.Option value="MEDIUM">보통 (MEDIUM)</Select.Option>
                                <Select.Option value="LOW">낮음 (LOW)</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="projectId" label="관련 프로젝트" rules={[{ required: true }]}>
                            <Select placeholder="프로젝트 선택">
                                {projects.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="approverId" label="승인권자" rules={[{ required: true }]}>
                            <Select placeholder="결재자 선택">
                                {members.filter(m => m.id !== currentUser?.id).map(m => (
                                    <Select.Option key={m.id} value={m.id}>{m.name} ({m.role})</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <Form.Item name="content" label="상세 내용" rules={[{ required: true, message: '상세 내용을 입력해주세요' }]}>
                        <TextArea rows={6} placeholder="결재 요청의 상세 배경 및 목적을 입력하세요." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                title="결재 상세 내역"
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                width={700}
                footer={selectedApproval?.status === 'PENDING' && selectedApproval.approverId === currentUser?.id ? [
                    <Button key="reject" danger onClick={() => setIsRejectModalOpen(true)}>반려</Button>,
                    <Button key="approve" type="primary" onClick={() => handleAction('APPROVED')}>승인</Button>
                ] : [
                    <Button key="close" onClick={() => setIsDetailModalOpen(false)}>닫기</Button>
                ]}
            >
                {selectedApproval && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>{selectedApproval.title}</Title>
                                <Space style={{ marginTop: 8 }}>
                                    <Tag color={getTypeConfig(selectedApproval.type).color}>{getTypeConfig(selectedApproval.type).label}</Tag>
                                    <Tag color={getPriorityColor(selectedApproval.priority)}>{selectedApproval.priority}</Tag>
                                </Space>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary">문서번호: {selectedApproval.id}</Text><br />
                                <Text type="secondary">일자: {dayjs(selectedApproval.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                            </div>
                        </div>

                        <Divider />

                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="기안자">{selectedApproval.requesterName}</Descriptions.Item>
                            <Descriptions.Item label="결재자">{selectedApproval.approverName}</Descriptions.Item>
                            <Descriptions.Item label="프로젝트" span={2}>{selectedApproval.projectName}</Descriptions.Item>
                            <Descriptions.Item label="현재상태" span={2}>
                                {(() => {
                                    const config = getStatusConfig(selectedApproval.status);
                                    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
                                })()}
                            </Descriptions.Item>
                            {selectedApproval.status === 'REJECTED' && (
                                <Descriptions.Item label="발려사유" span={2}>
                                    <Text type="danger">{selectedApproval.rejectionReason || '사유 없음'}</Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                            <Title level={5}>상세 기안 내용</Title>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedApproval.content}
                            </Paragraph>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reject Reason Modal */}
            <Modal
                title="반려 사유 입력"
                open={isRejectModalOpen}
                onOk={() => rejectForm.submit()}
                onCancel={() => setIsRejectModalOpen(false)}
                okText="반려 처리"
                okButtonProps={{ danger: true }}
            >
                <Form form={rejectForm} layout="vertical" onFinish={(values) => handleAction('REJECTED', values.reason)}>
                    <Form.Item name="reason" label="반려 사유" rules={[{ required: true, message: '반려 사유를 입력해주세요' }]}>
                        <TextArea rows={4} placeholder="반려하시는 구체적인 사유를 입력해 주세요." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Approvals;
