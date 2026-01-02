import React, { useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Avatar, Space, Button, theme, Empty } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  BellOutlined,
  MessageOutlined,
  FileDoneOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useProjectStore, ProjectStatus, IndustryType } from '../store/projectStore';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import { useActivityStore, ActivityType } from '../store/activityStore';
import { useApprovalStore } from '../store/approvalStore';
import { useMessageStore } from '../store/messageStore';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useNavigate } from 'react-router-dom';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';

dayjs.locale('ko');

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects: allProjects, addProject } = useProjectStore();
  const { tasks: allTasks, addTask } = useTaskStore();
  const { members } = useMemberStore();
  const { user } = useAuthStore();
  const { effectiveTheme } = useSettings();
  const { approvals } = useApprovalStore();
  const { messages } = useMessageStore();

  const projects = allProjects.filter(p => user?.role === 'admin' || (user?.memberId && p.teamMembers.includes(user.memberId)));
  const tasks = allTasks.filter(t => user?.role === 'admin' || (user?.memberId && t.assignee === user.memberId) || projects.some(p => p.id === t.projectId));
  const { activities } = useActivityStore();

  const pendingApprovals = approvals.filter(a => a.approverId === user?.id && a.status === 'PENDING');
  const recentMessages = messages.filter(m => m.type !== 'SYSTEM').slice(0, 10);
  const { token } = theme.useToken();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isDark = effectiveTheme === 'dark';

  const colors = {
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    subValueText: isDark ? '#e0e0e0' : '#262626',
  };

  const commonCardStyle: React.CSSProperties = {
    borderRadius: 12,
    height: '100%',
    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
    border: isDark ? '1px solid #303030' : '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
  };

  const cardBodyStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  // --- Statistics Calculations ---
  const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
  const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spentBudget, 0);
  const budgetUsageRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const doneTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // --- Weekly Summary ---
  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');

  const tasksCompletedThisWeek = tasks.filter(t =>
    t.status === TaskStatus.DONE &&
    t.dueDate &&
    dayjs(t.dueDate).isAfter(startOfWeek) &&
    dayjs(t.dueDate).isBefore(endOfWeek)
  ).length;

  const projectsStartedThisWeek = projects.filter(p =>
    dayjs(p.startDate).isAfter(startOfWeek) &&
    dayjs(p.startDate).isBefore(endOfWeek)
  ).length;

  // --- Chart Data ---
  const projectStatusData = [
    { name: '진행중', value: activeProjects, color: '#1890ff' },
    { name: '완료', value: completedProjects, color: '#52c41a' },
    { name: '계획', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length, color: '#8c8c8c' },
    { name: '보류/취소', value: projects.filter(p => p.status === ProjectStatus.ON_HOLD || p.status === ProjectStatus.CANCELLED).length, color: '#ff4d4f' },
  ].filter(item => item.value > 0);

  // 팀원별 업무 부하 데이터
  const teamWorkloadData = members.map(member => {
    const memberTasks = tasks.filter(t => t.assignee === member.id && t.status !== TaskStatus.DONE);
    return {
      name: member.name,
      tasks: memberTasks.length,
      highPriority: memberTasks.filter(t => t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH).length
    };
  }).sort((a, b) => b.tasks - a.tasks).slice(0, 5);

  // --- Upcoming Deadlines ---
  const upcomingTasks = tasks
    .filter(t => t.status !== TaskStatus.DONE && t.dueDate)
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
    .slice(0, 5);

  // --- My Tasks (Mock: First Member) ---
  const currentUser = members[0];
  const myTasks = currentUser
    ? tasks
      .filter(t => t.assignee === currentUser.id && t.status !== TaskStatus.DONE)
      .sort((a, b) => {
        const priorityScore = { [TaskPriority.URGENT]: 3, [TaskPriority.HIGH]: 2, [TaskPriority.MEDIUM]: 1, [TaskPriority.LOW]: 0 };
        if (priorityScore[b.priority] !== priorityScore[a.priority]) {
          return priorityScore[b.priority] - priorityScore[a.priority];
        }
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      })
      .slice(0, 5)
    : [];

  // --- Recent Activity ---
  const recentActivities = activities.slice(0, 5);

  // --- Handlers ---
  const handleProjectOk = (values: any) => {
    addProject({
      name: values.name,
      description: values.description,
      status: values.status,
      priority: values.priority,
      industry: values.industry || IndustryType.GENERAL,
      teamSize: values.teamMembers?.length || 0,
      teamMembers: values.teamMembers || [],
      startDate: values.dateRange[0].toDate(),
      endDate: values.dateRange[1].toDate(),
      budget: values.budget,
    });
    setIsProjectModalOpen(false);
  };

  const handleTaskOk = (values: any) => {
    const defaultProjectId = projects.find(p => p.status === ProjectStatus.IN_PROGRESS)?.id || projects[0]?.id;

    if (defaultProjectId) {
      addTask({
        projectId: defaultProjectId,
        title: values.title,
        description: values.description || '',
        status: values.status,
        priority: values.priority,
        assignee: values.assignee,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
        estimatedHours: values.estimatedHours,
      });
    }
    setIsTaskModalOpen(false);
  };

  // --- Priority Helpers ---
  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: '낮음',
    [TaskPriority.MEDIUM]: '보통',
    [TaskPriority.HIGH]: '높음',
    [TaskPriority.URGENT]: '긴급',
  };

  const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: 'default',
    [TaskPriority.MEDIUM]: 'blue',
    [TaskPriority.HIGH]: 'orange',
    [TaskPriority.URGENT]: 'red',
  };

  // --- Activity Type Label ---
  const getActivityLabel = (type: ActivityType): string => {
    switch (type) {
      case ActivityType.TASK_CREATED: return '새 작업을 생성했습니다: ';
      case ActivityType.TASK_STATUS_CHANGED: return '작업 상태를 변경했습니다: ';
      case ActivityType.TASK_UPDATED: return '작업을 수정했습니다: ';
      case ActivityType.PROJECT_CREATED: return '새 프로젝트를 생성했습니다: ';
      case ActivityType.PROJECT_COMPLETED: return '프로젝트를 완료했습니다: ';
      default: return '활동을 수행했습니다: ';
    }
  };

  // --- Helper Components ---
  const MetricCard = ({ title, value, prefix, suffix, color, subTitle, subValue }: any) => (
    <Card
      bordered={false}
      className="metric-card"
      style={{
        ...commonCardStyle,
        background: colors.cardBg,
      }}
    >
      <Statistic
        title={<Text style={{ fontSize: 14, color: colors.textSecondary }}>{title}</Text>}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: color, fontWeight: 600, fontSize: 28 }}
      />
      {subTitle && (
        <div style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
          {subTitle}: <span style={{ color: colors.subValueText, fontWeight: 500 }}>{subValue}</span>
        </div>
      )}
    </Card>
  );

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>대시보드</Title>
          <Text type="secondary">
            {dayjs().format('YYYY년 MM월 DD일 dddd')} | 안녕하세요, {currentUser?.name || '관리자'}님!
          </Text>
        </div>
        <Space>
          <Button icon={<BellOutlined />}>알림</Button>
          <Button type="primary" icon={<ProjectOutlined />} onClick={() => navigate('/projects')}>
            프로젝트 관리
          </Button>
        </Space>
      </div>

      {/* Management & Status Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            title={<Space><FileDoneOutlined style={{ color: token.colorPrimary }} /><span>내 결재 대기</span></Space>}
            bordered={false}
            style={commonCardStyle}
            extra={<Button type="link" size="small" onClick={() => navigate('/approvals')}>전체보기</Button>}
          >
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 180 }}>
              {pendingApprovals.length > 0 ? (
                <List
                  dataSource={pendingApprovals.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '12px 0' }}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<FileDoneOutlined />} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />}
                        title={<Text strong style={{ cursor: 'pointer' }} onClick={() => navigate('/approvals')}>{item.title}</Text>}
                        description={
                          <Space>
                            <Tag color="cyan" style={{ fontSize: 10 }}>{item.requesterName}</Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.createdAt).format('MM-DD')}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="승인할 서류가 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<Space><MessageOutlined style={{ color: '#52c41a' }} /><span>최근 협업 소식</span></Space>}
            bordered={false}
            style={commonCardStyle}
            extra={<Button type="link" size="small" onClick={() => navigate('/communication')}>전체보기</Button>}
          >
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 180 }}>
              {recentMessages.length > 0 ? (
                <List
                  dataSource={recentMessages.slice(0, 3)}
                  renderItem={(msg) => (
                    <List.Item style={{ padding: '12px 0' }}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<MessageOutlined />} style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} />}
                        title={<Text ellipsis style={{ width: '100%' }}>{msg.content}</Text>}
                        description={
                          <Space>
                            <Text strong style={{ fontSize: 11 }}>{msg.senderName}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(msg.createdAt).format('HH:mm')}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="새로운 메시지가 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<Space><BarChartOutlined style={{ color: '#722ed1' }} /><span>이번 주 리포트</span></Space>}
            bordered={false}
            style={commonCardStyle}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 180 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="완료한 작업"
                    value={tasksCompletedThisWeek}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>목표 대비 85%</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title="신규 프로젝트"
                    value={projectsStartedThisWeek}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<ProjectOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>전달 대비 +2</Text>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 24, padding: '12px', background: isDark ? '#262626' : '#f9f9f9', borderRadius: 8 }}>
                <Text strong style={{ fontSize: 13 }}>리더의 한마디:</Text><br />
                <Text italic style={{ fontSize: 12 }}>"이번 주 목표 달성까지 조금만 더 힘내세요!"</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Key Metrics Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="진행 중인 프로젝트"
            value={activeProjects}
            prefix={<ProjectOutlined />}
            color="#1890ff"
            subTitle="전체 프로젝트"
            subValue={`${projects.length}개`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="작업 완료율"
            value={taskCompletionRate}
            prefix={<CheckCircleOutlined />}
            suffix="%"
            color="#52c41a"
            subTitle="완료된 작업"
            subValue={`${doneTasks} / ${totalTasks}`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="예산 사용률"
            value={budgetUsageRate}
            prefix={<DollarOutlined />}
            suffix="%"
            color={budgetUsageRate > 90 ? '#cf1322' : '#faad14'}
            subTitle="총 지출"
            subValue={`${(totalSpent / 1000000).toFixed(1)}M`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="프로젝트 팀원"
            value={members.length}
            prefix={<TeamOutlined />}
            color="#722ed1"
            subTitle="활성 멤버"
            subValue={`${members.length}명`}
          />
        </Col>
      </Row>

      {/* Row 1: Project Status, Team Workload, My Tasks */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }} align="stretch">
        <Col xs={24} md={12} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card title="프로젝트 상태" bordered={false} style={commonCardStyle} bodyStyle={cardBodyStyle}>
            <div style={{ flex: 1, minHeight: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card title="팀원별 업무 부하 (Top 5)" bordered={false} style={commonCardStyle} bodyStyle={cardBodyStyle}>
            <div style={{ flex: 1, minHeight: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamWorkloadData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="tasks" name="전체 작업" stackId="a" fill="#1890ff" barSize={20} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="highPriority" name="긴급/높음" stackId="a" fill="#ff4d4f" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            title="나의 할 일"
            bordered={false}
            style={commonCardStyle}
            bodyStyle={cardBodyStyle}
            extra={<Button type="link" onClick={() => navigate('/tasks')}>전체보기</Button>}
          >
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 250 }}>
              <List
                dataSource={myTasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<CheckSquareOutlined />} style={{ backgroundColor: priorityColors[task.priority] }} />}
                      title={<Text delete={task.status === TaskStatus.DONE}>{task.title}</Text>}
                      description={
                        <Space size="small">
                          <Tag color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(task.dueDate).format('MM.DD')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
              {myTasks.length === 0 && <Empty description="할 일이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Recent Activity, Upcoming Deadlines */}
      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card title="최근 활동" bordered={false} style={commonCardStyle} bodyStyle={cardBodyStyle}>
            <div style={{ flex: 1, minHeight: 300 }}>
              {recentActivities.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={recentActivities}
                  renderItem={(activity) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor:
                                activity.type.includes('CREATED') || activity.type.includes('ADDED') ? '#52c41a' :
                                  activity.type.includes('DELETED') || activity.type.includes('REMOVED') ? '#ff4d4f' : '#1890ff'
                            }}
                            icon={
                              activity.type.includes('PROJECT') ? <ProjectOutlined /> :
                                activity.type.includes('TASK') ? <CheckSquareOutlined /> : <TeamOutlined />
                            }
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{activity.userName}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(activity.timestamp).fromNow()}
                            </Text>
                          </Space>
                        }
                        description={
                          <span>
                            {getActivityLabel(activity.type)}
                            <Text strong>{activity.taskName || activity.projectName}</Text>
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="최근 활동이 없습니다." />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            title={<Space><CalendarOutlined /><span>다가오는 마감일</span></Space>}
            bordered={false}
            style={commonCardStyle}
            bodyStyle={cardBodyStyle}
          >
            <div style={{ flex: 1, minHeight: 300 }}>
              <List
                itemLayout="horizontal"
                dataSource={upcomingTasks}
                renderItem={(task) => {
                  const daysLeft = dayjs(task.dueDate).diff(dayjs(), 'day');
                  const isUrgent = daysLeft <= 3;

                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={isUrgent ? <ClockCircleOutlined /> : <CalendarOutlined />}
                            style={{ backgroundColor: isUrgent ? '#fff1f0' : '#f6ffed', color: isUrgent ? '#ff4d4f' : '#52c41a' }}
                          />
                        }
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 14 }}>{task.title}</Text>
                            {isUrgent && <Tag color="red">D-{daysLeft}</Tag>}
                          </Space>
                        }
                        description={
                          <div style={{ fontSize: 12 }}>
                            <Text type="secondary">{dayjs(task.dueDate).format('YYYY-MM-DD')}</Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
              {upcomingTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: colors.textSecondary }}>
                  예정된 마감일이 없습니다
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <ProjectModal
        open={isProjectModalOpen}
        onOk={handleProjectOk}
        onCancel={() => setIsProjectModalOpen(false)}
        title="새 프로젝트 추가"
        okText="추가"
      />

      <TaskModal
        open={isTaskModalOpen}
        onOk={handleTaskOk}
        onCancel={() => setIsTaskModalOpen(false)}
        title="새 작업 추가"
        okText="추가"
      />
    </div>
  );
};

export default Dashboard;
