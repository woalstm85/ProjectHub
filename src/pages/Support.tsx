import React, { useState } from 'react';
import {
    Typography,
    Tabs,
    Collapse,
    Form,
    Input,
    Button,
    Select,
    Card,
    Row,
    Col,
    Space,
    Tag,
    Divider,
    message,
    Alert,
    Steps
} from 'antd';
import {
    QuestionCircleOutlined,
    MailOutlined,
    BugOutlined,
    BulbOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    SafetyCertificateOutlined,
    SendOutlined,
    UserOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

const Support: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // FAQ Data
    const faqData = [
        {
            category: '계정 및 보안',
            items: [
                { q: '비밀번호를 분실했습니다. 어떻게 재설정하나요?', a: '로그인 화면의 "비밀번호 찾기" 링크를 클릭하여 이메일 인증을 통해 비밀번호를 재설정할 수 있습니다.' },
                { q: '2단계 인증을 설정하고 싶습니다.', a: '설정 > 계정 보안 메뉴에서 2단계 인증(OTP)을 활성화할 수 있습니다.' },
            ]
        },
        {
            category: '프로젝트 관리',
            items: [
                { q: '프로젝트를 삭제하면 복구할 수 있나요?', a: '프로젝트 삭제 후 30일 이내에는 휴지통에서 복구가 가능합니다. 그 이후에는 영구 삭제됩니다.' },
                { q: '팀원을 프로젝트에 어떻게 초대하나요?', a: '프로젝트 설정 > 멤버 관리 탭에서 이메일 주소로 팀원을 초대할 수 있습니다.' },
            ]
        },
        {
            category: '결제 및 요금',
            items: [
                { q: '요금제를 변경하고 싶습니다.', a: '관리자 페이지의 "구독 관리" 메뉴에서 언제든지 요금제를 업그레이드하거나 다운그레이드할 수 있습니다.' },
                { q: '영수증은 어디서 출력하나요?', a: '결제 내역 페이지에서 각 결제 건에 대한 영수증을 PDF로 다운로드할 수 있습니다.' },
            ]
        }
    ];

    // Inquiry Handler
    const handleInquirySubmit = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            message.success('문의가 성공적으로 접수되었습니다. 답변은 이메일로 발송됩니다.');
            form.resetFields();
        }, 1500);
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: 48, padding: '40px 0' }}>
                <Title level={1} style={{ marginBottom: 16 }}>고객지원 센터</Title>
                <Paragraph type="secondary" style={{ fontSize: 18 }}>
                    무엇을 도와드릴까요? ProjectHub 팀이 언제나 여러분 곁에 있습니다.
                </Paragraph>
                <Space size="large" style={{ marginTop: 24 }}>
                    <Card style={{ width: 300, borderRadius: 12, textAlign: 'left' }} hoverable>
                        <Space align="start">
                            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                            <div>
                                <Text strong>시스템 상태</Text>
                                <div style={{ marginTop: 4 }}><Tag color="success">모든 서비스 정상 운영 중</Tag></div>
                            </div>
                        </Space>
                    </Card>
                </Space>
            </div>

            <Tabs
                defaultActiveKey="1"
                size="large"
                centered
                items={[
                    {
                        key: '1',
                        label: (
                            <span>
                                <QuestionCircleOutlined />
                                자주 묻는 질문 (FAQ)
                            </span>
                        ),
                        children: (
                            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                                {faqData.map((section, idx) => (
                                    <Col xs={24} md={24} lg={12} key={idx}>
                                        <Card
                                            title={<Text strong style={{ fontSize: 16 }}>{section.category}</Text>}
                                            bordered={false}
                                            style={{ height: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                                        >
                                            <Collapse ghost expandIconPosition="end">
                                                {section.items.map((item, i) => (
                                                    <Panel header={item.q} key={i}>
                                                        <Paragraph style={{ color: '#666' }}>{item.a}</Paragraph>
                                                    </Panel>
                                                ))}
                                            </Collapse>
                                        </Card>
                                    </Col>
                                ))}
                                <Col span={24}>
                                    <Alert
                                        message="찾으시는 질문이 없나요?"
                                        description="문의하기 탭을 통해 직접 문의를 남겨주시면 신속하게 답변해 드리겠습니다."
                                        type="info"
                                        showIcon
                                        action={
                                            <Button size="small" type="primary" onClick={() => document.getElementById('inquiry-tab-btn')?.click()}>
                                                문의하기로 이동
                                            </Button>
                                        }
                                        style={{ marginTop: 24, borderRadius: 8 }}
                                    />
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: '2',
                        label: (
                            <span id="inquiry-tab-btn">
                                <MailOutlined />
                                문의하기
                            </span>
                        ),
                        children: (
                            <Row justify="center" style={{ marginTop: 24 }}>
                                <Col xs={24} md={16} lg={12}>
                                    <Card
                                        bordered={false}
                                        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    >
                                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                            <Title level={3}>문의 접수</Title>
                                            <Text type="secondary">
                                                버그 제보, 기능 요청, 기타 문의사항을 남겨주세요.
                                            </Text>
                                        </div>

                                        <Form
                                            form={form}
                                            layout="vertical"
                                            onFinish={handleInquirySubmit}
                                            requiredMark="optional"
                                        >
                                            <Form.Item
                                                name="type"
                                                label="문의 유형"
                                                rules={[{ required: true, message: '문의 유형을 선택해주세요.' }]}
                                            >
                                                <Select placeholder="유형 선택" size="large">
                                                    <Option value="bug"><Space><BugOutlined /> 버그 신고</Space></Option>
                                                    <Option value="feature"><Space><BulbOutlined /> 기능 개선 요청</Space></Option>
                                                    <Option value="account"><Space><UserOutlined /> 계정 관련</Space></Option>
                                                    <Option value="billing"><Space><SafetyCertificateOutlined /> 결제 문의</Space></Option>
                                                    <Option value="other"><Space><InfoCircleOutlined /> 기타</Space></Option>
                                                </Select>
                                            </Form.Item>

                                            <Form.Item
                                                name="title"
                                                label="제목"
                                                rules={[{ required: true, message: '제목을 입력해주세요.' }]}
                                            >
                                                <Input placeholder="문의 제목을 간략히 입력해주세요" size="large" />
                                            </Form.Item>

                                            <Form.Item
                                                name="content"
                                                label="내용"
                                                rules={[{ required: true, message: '내용을 입력해주세요.' }]}
                                            >
                                                <TextArea
                                                    placeholder="구체적인 내용을 적어주시면 더 빠르고 정확한 답변이 가능합니다."
                                                    rows={6}
                                                    showCount
                                                    maxLength={1000}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="email"
                                                label="답변 받을 이메일"
                                                rules={[
                                                    { required: true, message: '이메일을 입력해주세요.' },
                                                    { type: 'email', message: '올바른 이메일 형식이 아닙니다.' }
                                                ]}
                                                initialValue="user@example.com" // Mock user email
                                            >
                                                <Input prefix={<MailOutlined />} size="large" />
                                            </Form.Item>

                                            <Divider />

                                            <Form.Item>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    size="large"
                                                    block
                                                    loading={loading}
                                                    icon={<SendOutlined />}
                                                    style={{ height: 48, fontSize: 16 }}
                                                >
                                                    문의 접수하기
                                                </Button>
                                            </Form.Item>
                                        </Form>
                                    </Card>

                                    <div style={{ marginTop: 32 }}>
                                        <Steps
                                            current={0}
                                            items={[
                                                { title: '문의 접수', description: '문의가 시스템에 등록됩니다.', icon: <SendOutlined /> },
                                                { title: '담당자 배정', description: '24시간 이내에 담당자가 확인합니다.', icon: <ClockCircleOutlined /> },
                                                { title: '답변 완료', description: '이메일로 답변이 발송됩니다.', icon: <CheckCircleOutlined /> },
                                            ]}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        )
                    }
                ]}
            />
        </div>
    );
};

export default Support;
