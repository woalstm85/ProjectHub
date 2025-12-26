import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Typography, Avatar, Space, Button, theme, Timeline, Empty } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  BellOutlined,
  PlusOutlined,
  UserAddOutlined,
  ThunderboltOutlined,
  CheckSquareOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useProjectStore, ProjectStatus, type CreateProjectDTO } from '../store/projectStore';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import { useActivityStore, ActivityType } from '../store/activityStore';
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
  const { projects, addProject } = useProjectStore();
  const { tasks, addTask } = useTaskStore();
  const { members } = useMemberStore();
  const { effectiveTheme } = useSettings();
  const { activities } = useActivityStore();
  const { token } = theme.useToken();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isDark = effectiveTheme === 'dark';

  // 다크모드 색상 및 스타일
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
    { name: '보류/취소', value: projects.filter(p => [ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED].includes(p.status)).length, color: '#ff4d4f' },
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

      {/* Quick Actions & Weekly Summary */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{
              ...commonCardStyle,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
              border: 'none', // Override border for gradient card
              boxShadow: '0 4px 16px rgba(24, 144, 255, 0.2)', // Custom shadow for primary card
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <div>
                <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>빠른 실행</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>자주 사용하는 기능을 바로 실행하세요.</Text>
                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <Button size="large" icon={<PlusOutlined />} onClick={() => setIsProjectModalOpen(true)}>새 프로젝트</Button>
                  <Button size="large" icon={<CheckSquareOutlined />} onClick={() => setIsTaskModalOpen(true)}>새 작업</Button>
                  <Button size="large" icon={<UserAddOutlined />} onClick={() => navigate('/members')}>팀원 초대</Button>
                </div>
              </div>
              <ThunderboltOutlined style={{ fontSize: 120, opacity: 0.2, color: '#fff' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="이번 주 요약" bordered={false} style={commonCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', alignItems: 'center', height: '100%' }}>
              <div>
                <Statistic title="완료한 작업" value={tasksCompletedThisWeek} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              </div>
              <div>
                <Statistic title="시작한 프로젝트" value={projectsStartedThisWeek} prefix={<ProjectOutlined style={{ color: '#1890ff' }} />} />
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
                            {activity.type === ActivityType.TASK_CREATED ? '새 작업을 생성했습니다: ' :
                              activity.type === ActivityType.TASK_COMPLETED ? '작업을 완료했습니다: ' :
                                activity.type === ActivityType.PROJECT_CREATED ? '새 프로젝트를 생성했습니다: ' :
                                  '활동을 수행했습니다: '}
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
