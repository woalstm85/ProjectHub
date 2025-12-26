import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Button,
  Form,
  Input,
  Upload,
  message,
  Tabs,
  Table,
  Tag,
  Progress,
  Statistic,
  Space,
  Timeline,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CameraOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FireOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // 현재 로그인한 사용자와 매칭되는 멤버 찾기
  const currentMember = members.find(m => m.email === user?.email);
  const memberId = currentMember?.id;

  // 내 작업 통계
  const myTasks = memberId ? tasks.filter(t => t.assignee === memberId) : [];
  const completedTasks = myTasks.filter(t => t.status === TaskStatus.DONE);
  const inProgressTasks = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const reviewTasks = myTasks.filter(t => t.status === TaskStatus.REVIEW);

  const completionRate = myTasks.length > 0
    ? Math.round((completedTasks.length / myTasks.length) * 100)
    : 0;

  // 마감 임박 작업 (7일 이내)
  const upcomingDeadlines = myTasks
    .filter(t => t.status !== TaskStatus.DONE && t.dueDate)
    .filter(t => dayjs(t.dueDate).diff(dayjs(), 'day') <= 7 && dayjs(t.dueDate).diff(dayjs(), 'day') >= 0)
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());

  // 지연된 작업
  const overdueTasks = myTasks
    .filter(t => t.status !== TaskStatus.DONE && t.dueDate)
    .filter(t => dayjs(t.dueDate).isBefore(dayjs(), 'day'));

  // 내가 참여중인 프로젝트
  const myProjects = projects.filter(p => p.teamMembers?.includes(memberId || ''));

  // 최근 활동 (최근 완료한 작업들)
  const recentActivities = [...completedTasks]
    .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
    .slice(0, 5);

  // 프로필 수정
  const handleEditProfile = () => {
    form.setFieldsValue({
      name: user?.name,
      email: user?.email,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setUser({
        ...user!,
        name: values.name,
        email: values.email,
      });
      setIsEditing(false);
      message.success('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      // 실제로는 API 호출
      message.success('비밀번호가 변경되었습니다.');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const taskStatusColors: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'default',
    [TaskStatus.IN_PROGRESS]: 'processing',
    [TaskStatus.REVIEW]: 'warning',
    [TaskStatus.DONE]: 'success',
  };

  const taskStatusLabels: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '할 일',
    [TaskStatus.IN_PROGRESS]: '진행중',
    [TaskStatus.REVIEW]: '검토중',
    [TaskStatus.DONE]: '완료',
  };

  const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: 'default',
    [TaskPriority.MEDIUM]: 'blue',
    [TaskPriority.HIGH]: 'orange',
    [TaskPriority.URGENT]: 'red',
  };

  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: '낮음',
    [TaskPriority.MEDIUM]: '보통',
    [TaskPriority.HIGH]: '높음',
    [TaskPriority.URGENT]: '긴급',
  };

  // 내 작업 테이블 컬럼
  const taskColumns = [
    {
      title: '작업명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '프로젝트',
      dataIndex: 'projectId',
      key: 'projectId',
      width: 150,
      render: (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || '-';
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={taskStatusColors[status]}>{taskStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '우선순위',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: TaskPriority) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      ),
    },
    {
      title: '마감일',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date: Date) => {
        if (!date) return '-';
        const isOverdue = dayjs(date).isBefore(dayjs(), 'day');
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : isToday ? '#faad14' : 'inherit' }}>
            {dayjs(date).format('MM.DD')}
            {isOverdue && ' (지연)'}
          </span>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '개요',
      children: (
        <Row gutter={[24, 24]}>
          {/* 작업 통계 카드 */}
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#f0f5ff', borderRadius: 12 }}>
                  <Statistic
                    title={<span style={{ color: '#1890ff' }}>전체 작업</span>}
                    value={myTasks.length}
                    prefix={<ProjectOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff7e6', borderRadius: 12 }}>
                  <Statistic
                    title={<span style={{ color: '#fa8c16' }}>진행중</span>}
                    value={inProgressTasks.length + reviewTasks.length}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#f6ffed', borderRadius: 12 }}>
                  <Statistic
                    title={<span style={{ color: '#52c41a' }}>완료</span>}
                    value={completedTasks.length}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ textAlign: 'center', background: '#fff1f0', borderRadius: 12 }}>
                  <Statistic
                    title={<span style={{ color: '#ff4d4f' }}>지연</span>}
                    value={overdueTasks.length}
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* 완료율 & 참여 프로젝트 */}
          <Col xs={24} lg={12}>
            <Card title="작업 완료율" bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Progress
                  type="dashboard"
                  percent={completionRate}
                  size={180}
                  strokeColor={{
                    '0%': '#667eea',
                    '100%': '#764ba2',
                  }}
                  format={(percent) => (
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#1a202c' }}>{percent}%</div>
                      <div style={{ fontSize: 14, color: '#8c8c8c' }}>완료율</div>
                    </div>
                  )}
                />
                <div style={{ marginTop: 24 }}>
                  <Space size={32}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{completedTasks.length}</div>
                      <div style={{ color: '#8c8c8c' }}>완료</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{myTasks.length - completedTasks.length}</div>
                      <div style={{ color: '#8c8c8c' }}>남은 작업</div>
                    </div>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="참여 프로젝트" bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              {myProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myProjects.slice(0, 4).map(project => (
                    <div
                      key={project.id}
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text strong>{project.name}</Text>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {dayjs(project.endDate).format('YYYY.MM.DD')} 마감
                        </div>
                      </div>
                      <Progress
                        type="circle"
                        percent={project.progress}
                        size={40}
                        strokeColor="#667eea"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                  참여중인 프로젝트가 없습니다.
                </div>
              )}
            </Card>
          </Col>

          {/* 마감 임박 작업 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#faad14' }} />
                  마감 임박 (7일 이내)
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              {upcomingDeadlines.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingDeadlines.map(task => {
                    const daysLeft = dayjs(task.dueDate).diff(dayjs(), 'day');
                    return (
                      <div
                        key={task.id}
                        style={{
                          padding: '10px 12px',
                          background: daysLeft <= 2 ? '#fff7e6' : '#fafafa',
                          borderRadius: 6,
                          borderLeft: `3px solid ${daysLeft <= 2 ? '#faad14' : '#d9d9d9'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>{task.title}</Text>
                          <Tag color={daysLeft === 0 ? 'red' : daysLeft <= 2 ? 'orange' : 'blue'}>
                            {daysLeft === 0 ? '오늘' : `D-${daysLeft}`}
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#8c8c8c' }}>
                  마감 임박 작업이 없습니다 🎉
                </div>
              )}
            </Card>
          </Col>

          {/* 최근 활동 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#52c41a' }} />
                  최근 완료한 작업
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              {recentActivities.length > 0 ? (
                <Timeline
                  items={recentActivities.map(task => ({
                    color: 'green',
                    children: (
                      <div>
                        <Text>{task.title}</Text>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {dayjs(task.updatedAt).fromNow()}
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#8c8c8c' }}>
                  완료한 작업이 없습니다.
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'tasks',
      label: `내 작업 (${myTasks.length})`,
      children: (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Table
            columns={taskColumns}
            dataSource={myTasks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: '계정 설정',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="프로필 정보" bordered={false} style={{ borderRadius: 12 }}>
              {isEditing ? (
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="name"
                    label="이름"
                    rules={[{ required: true, message: '이름을 입력해주세요' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="이메일"
                    rules={[
                      { required: true, message: '이메일을 입력해주세요' },
                      { type: 'email', message: '올바른 이메일을 입력해주세요' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile}>
                      저장
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>취소</Button>
                  </Space>
                </Form>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">이름</Text>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.name}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">이메일</Text>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.email}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">아이디</Text>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.username}</div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <Text type="secondary">가입일</Text>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>
                      {user?.createdAt ? dayjs(user.createdAt).format('YYYY년 MM월 DD일') : '-'}
                    </div>
                  </div>
                  <Button icon={<EditOutlined />} onClick={handleEditProfile}>
                    프로필 수정
                  </Button>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="보안 설정" bordered={false} style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary">비밀번호</Text>
                <div style={{ fontSize: 16, fontWeight: 500 }}>••••••••</div>
              </div>
              <Button icon={<LockOutlined />} onClick={() => setIsPasswordModalOpen(true)}>
                비밀번호 변경
              </Button>
            </Card>

            <Card title="계정 정보" bordered={false} style={{ borderRadius: 12, marginTop: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">역할</Text>
                  <Tag color="purple">{currentMember?.role || '사용자'}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">부서</Text>
                  <Text>{currentMember?.department || '-'}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">상태</Text>
                  <Tag color="success">활성</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      {/* 프로필 헤더 */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row gutter={24} align="middle">
          <Col>
            <div style={{ position: 'relative' }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{
                  border: '4px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                }}
              />
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={() => {
                  message.info('프로필 사진 업로드 기능 (데모)');
                }}
              >
                <Button
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    border: '2px solid white',
                  }}
                />
              </Upload>
            </div>
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              {user?.name || '사용자'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              {user?.email}
            </Text>
            <div style={{ marginTop: 12 }}>
              <Space>
                <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none' }}>
                  {currentMember?.role || '사용자'}
                </Tag>
                <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none' }}>
                  {currentMember?.department || '부서 미지정'}
                </Tag>
              </Space>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="center" style={{ color: 'white' }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{completedTasks.length}</div>
              <div style={{ opacity: 0.8 }}>완료한 작업</div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 탭 콘텐츠 */}
      <Tabs items={tabItems} size="large" />

      {/* 비밀번호 변경 모달 */}
      <Modal
        title="비밀번호 변경"
        open={isPasswordModalOpen}
        onOk={handlePasswordChange}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        okText="변경"
        cancelText="취소"
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="currentPassword"
            label="현재 비밀번호"
            rules={[{ required: true, message: '현재 비밀번호를 입력해주세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="새 비밀번호"
            rules={[
              { required: true, message: '새 비밀번호를 입력해주세요' },
              { min: 6, message: '최소 6자 이상 입력해주세요' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="새 비밀번호 확인"
            rules={[{ required: true, message: '새 비밀번호를 다시 입력해주세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
