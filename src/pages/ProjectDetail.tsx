import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  Progress,
  Timeline,
  Statistic,
  Empty,
  Tabs,
  Table,
  Popconfirm,
  message,
  List,
  Avatar,
  Tooltip,
  Upload,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useProjectStore, ProjectStatus, ProjectPriority, Methodology } from '../store/projectStore';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useActivityStore, ActivityType } from '../store/activityStore';
import dayjs from 'dayjs';
import TaskModal from '../components/TaskModal';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { members } = useMemberStore();
  const { activities } = useActivityStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const project = projects.find((p) => p.id === id);
  const projectTasks = tasks.filter((t) => t.projectId === id);
  const projectActivities = activities.filter((a) => a.projectId === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!project) {
    return (
      <Card>
        <Empty description="프로젝트를 찾을 수 없습니다." />
        <Button onClick={() => navigate('/projects')}>프로젝트 목록으로</Button>
      </Card>
    );
  }

  const statusLabels: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: '계획',
    [ProjectStatus.IN_PROGRESS]: '진행중',
    [ProjectStatus.ON_HOLD]: '보류',
    [ProjectStatus.COMPLETED]: '완료',
    [ProjectStatus.CANCELLED]: '취소',
  };

  const priorityLabels: Record<ProjectPriority, string> = {
    [ProjectPriority.LOW]: '낮음',
    [ProjectPriority.MEDIUM]: '보통',
    [ProjectPriority.HIGH]: '높음',
    [ProjectPriority.URGENT]: '긴급',
  };

  const taskPriorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: '낮음',
    [TaskPriority.MEDIUM]: '보통',
    [TaskPriority.HIGH]: '높음',
    [TaskPriority.URGENT]: '긴급',
  };

  const methodologyLabels: Record<Methodology, string> = {
    [Methodology.WATERFALL]: '워터폴',
    [Methodology.AGILE]: '애자일',
    [Methodology.SCRUM]: '스크럼',
    [Methodology.KANBAN]: '칸반',
  };

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: 'default',
    [ProjectStatus.IN_PROGRESS]: 'processing',
    [ProjectStatus.ON_HOLD]: 'warning',
    [ProjectStatus.COMPLETED]: 'success',
    [ProjectStatus.CANCELLED]: 'error',
  };

  const priorityColors: Record<ProjectPriority, string> = {
    [ProjectPriority.LOW]: 'default',
    [ProjectPriority.MEDIUM]: 'blue',
    [ProjectPriority.HIGH]: 'orange',
    [ProjectPriority.URGENT]: 'red',
  };

  const taskStatusLabels: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '할일',
    [TaskStatus.IN_PROGRESS]: '진행중',
    [TaskStatus.REVIEW]: '검토중',
    [TaskStatus.DONE]: '완료',
  };

  const taskStatusColors: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'default',
    [TaskStatus.IN_PROGRESS]: 'processing',
    [TaskStatus.REVIEW]: 'warning',
    [TaskStatus.DONE]: 'success',
  };

  // 워터폴 단계 정의
  const waterfallPhases = [
    { key: 'requirement', name: '요구사항 분석', progress: 100 },
    { key: 'design', name: '설계', progress: 100 },
    { key: 'implementation', name: '구현', progress: project.progress },
    { key: 'testing', name: '테스트', progress: Math.max(0, project.progress - 20) },
    { key: 'deployment', name: '배포', progress: Math.max(0, project.progress - 40) },
  ];

  // 작업 통계
  const taskStats = {
    total: projectTasks.length,
    todo: projectTasks.filter((t) => t.status === TaskStatus.TODO).length,
    inProgress: projectTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    review: projectTasks.filter((t) => t.status === TaskStatus.REVIEW).length,
    done: projectTasks.filter((t) => t.status === TaskStatus.DONE).length,
  };

  const budgetUsagePercent = project.budget > 0
    ? Math.round((project.spentBudget / project.budget) * 100)
    : 0;

  const daysTotal = dayjs(project.endDate).diff(dayjs(project.startDate), 'day');
  const daysPassed = dayjs().diff(dayjs(project.startDate), 'day');
  const daysRemaining = dayjs(project.endDate).diff(dayjs(), 'day');
  const timeProgress = Math.min(100, Math.max(0, Math.round((daysPassed / daysTotal) * 100)));

  // 작업 관리 함수
  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskOk = (values: any) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: values.title,
        description: values.description || '',
        status: values.status,
        priority: values.priority,
        assignee: values.assignee,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
        estimatedHours: values.estimatedHours,
      });
      message.success('작업이 수정되었습니다');
    } else {
      addTask({
        projectId: id!,
        title: values.title,
        description: values.description || '',
        status: values.status,
        priority: values.priority,
        assignee: values.assignee,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
        estimatedHours: values.estimatedHours,
      });
      message.success('작업이 추가되었습니다');
    }

    setIsTaskModalOpen(false);
  };

  const handleTaskCancel = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    message.success('작업이 삭제되었습니다');
  };

  // 작업 테이블 컬럼
  const taskColumns = [
    {
      title: '작업명',
      dataIndex: 'title',
      key: 'title',
      width: 250,
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
      width: 100,
      render: (priority: TaskPriority) => (
        <Tag color={priorityColors[priority]}>{taskPriorityLabels[priority]}</Tag>
      ),
    },
    {
      title: '담당자',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assigneeId: string) => {
        const member = members.find((m) => m.id === assigneeId);
        return member ? member.name : '-';
      },
    },
    {
      title: '마감일',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: Date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          />
          <Popconfirm
            title="작업 삭제"
            description="정말 이 작업을 삭제하시겠습니까?"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 간트 차트 렌더링
  const renderGanttChart = () => {
    const sortedTasks = [...projectTasks].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });

    if (sortedTasks.length === 0) {
      return <Empty description="표시할 작업이 없습니다." />;
    }

    const minDate = sortedTasks.reduce((min, t) => {
      const d = t.startDate ? new Date(t.startDate).getTime() : Infinity;
      return d < min ? d : min;
    }, Infinity);

    const maxDate = sortedTasks.reduce((max, t) => {
      const d = t.dueDate ? new Date(t.dueDate).getTime() : 0;
      return d > max ? d : max;
    }, 0);

    const totalDuration = maxDate - minDate;

    // 유효한 날짜가 없는 경우 처리
    if (totalDuration <= 0 || minDate === Infinity) {
      return <Empty description="작업에 시작일/마감일이 설정되지 않았습니다." />;
    }

    return (
      <div style={{ overflowX: 'auto', padding: '20px 0' }}>
        <div style={{ minWidth: 800 }}>
          {sortedTasks.map(task => {
            if (!task.startDate || !task.dueDate) return null;

            const start = new Date(task.startDate).getTime();
            const end = new Date(task.dueDate).getTime();
            const duration = end - start;

            const left = ((start - minDate) / totalDuration) * 100;
            const width = Math.max((duration / totalDuration) * 100, 1); // 최소 1% 너비

            return (
              <div key={task.id} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 200, marginRight: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.title}
                </div>
                <div style={{ flex: 1, position: 'relative', height: 24, background: '#f0f0f0', borderRadius: 4 }}>
                  <Tooltip title={`${dayjs(task.startDate).format('MM/DD')} ~ ${dayjs(task.dueDate).format('MM/DD')}`}>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        background: (task.status && taskStatusColors[task.status] === 'processing') ? '#1890ff' :
                          (task.status && taskStatusColors[task.status] === 'success') ? '#52c41a' :
                            (task.status && taskStatusColors[task.status] === 'warning') ? '#faad14' : '#d9d9d9',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 팀 관리 탭
  const renderTeamTab = () => {
    const projectMembers = members.filter(m => project.teamMembers.includes(m.id));

    return (
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        dataSource={projectMembers}
        renderItem={(member) => {
          const memberTasks = projectTasks.filter(t => t.assignee === member.id);
          const completedTasks = memberTasks.filter(t => t.status === TaskStatus.DONE).length;

          return (
            <List.Item>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <Avatar src={member.avatar} size={48} style={{ marginRight: 16 }}>{member.name[0]}</Avatar>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{member.name}</div>
                    <div style={{ color: '#8c8c8c' }}>{member.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>할당된 작업</span>
                  <strong>{memberTasks.length}개</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>완료한 작업</span>
                  <strong style={{ color: '#52c41a' }}>{completedTasks}개</strong>
                </div>
                <Progress percent={memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0} size="small" />
              </Card>
            </List.Item>
          );
        }}
      />
    );
  };

  // 파일 탭 (Mock)
  const renderFilesTab = () => {
    const mockFiles = [
      { name: '요구사항_정의서_v1.0.pdf', size: '2.4 MB', date: '2024-01-15', uploader: '김철수' },
      { name: 'UI_디자인_시안.fig', size: '15.8 MB', date: '2024-01-20', uploader: '이영희' },
      { name: 'API_명세서.docx', size: '1.2 MB', date: '2024-02-01', uploader: '박지민' },
    ];

    return (
      <Card title="프로젝트 문서">
        <div style={{ marginBottom: 16 }}>
          <Upload>
            <Button icon={<UploadOutlined />}>파일 업로드</Button>
          </Upload>
        </div>
        <List
          itemLayout="horizontal"
          dataSource={mockFiles}
          renderItem={(item) => (
            <List.Item
              actions={[<Button type="link">다운로드</Button>, <Button type="link" danger>삭제</Button>]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                title={item.name}
                description={
                  <Space split="|">
                    <span>{item.size}</span>
                    <span>{item.date}</span>
                    <span>{item.uploader}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // 활동 피드 탭
  const renderActivityTab = () => {
    return (
      <Card title="최근 활동">
        {projectActivities.length > 0 ? (
          <Timeline
            items={projectActivities.map(activity => ({
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {activity.userName}님이 {activity.type === ActivityType.TASK_CREATED ? '작업을 생성했습니다' :
                      (activity.type === ActivityType.TASK_STATUS_CHANGED && activity.newValue === 'DONE') ? '작업을 완료했습니다' :
                        activity.type === ActivityType.PROJECT_CREATED ? '프로젝트를 생성했습니다' : '활동을 수행했습니다'}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {dayjs(activity.timestamp).format('YYYY-MM-DD HH:mm')}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {activity.taskName && <Tag>{activity.taskName}</Tag>}
                    {activity.projectName && <Tag color="blue">{activity.projectName}</Tag>}
                  </div>
                </div>
              ),
              color: 'blue'
            }))}
          />
        ) : (
          <Empty description="활동 기록이 없습니다." />
        )}
      </Card>
    );
  };

  // 탭 아이템
  const tabItems = [
    {
      key: 'overview',
      label: '개요',
      children: (
        <>
          {/* 주요 지표 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Statistic
                  title={<span style={{ color: '#8c8c8c', fontSize: '14px' }}>전체 진행률</span>}
                  value={project.progress}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontWeight: 600, fontSize: '24px' }}
                />
                <Progress percent={project.progress} showInfo={false} strokeColor="#1890ff" style={{ marginTop: 12 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Statistic
                  title={<span style={{ color: '#8c8c8c', fontSize: '14px' }}>예산 사용률</span>}
                  value={budgetUsagePercent}
                  suffix="%"
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontWeight: 600, fontSize: '24px' }}
                />
                <Progress
                  percent={budgetUsagePercent}
                  showInfo={false}
                  status={budgetUsagePercent > 90 ? 'exception' : 'normal'}
                  strokeColor={budgetUsagePercent > 90 ? '#ff4d4f' : '#52c41a'}
                  style={{ marginTop: 12 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Statistic
                  title={<span style={{ color: '#8c8c8c', fontSize: '14px' }}>시간 경과</span>}
                  value={timeProgress}
                  suffix="%"
                  prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontWeight: 600, fontSize: '24px' }}
                />
                <Progress percent={timeProgress} showInfo={false} strokeColor="#faad14" style={{ marginTop: 12 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ height: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ color: '#8c8c8c', fontSize: '14px' }}>프로젝트 팀원</span>
                  <TeamOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 600 }}>{project.teamMembers.length}</span>
                  <span style={{ fontSize: '14px', color: '#8c8c8c' }}>명</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {project.teamMembers.map((memberId) => {
                    const member = members.find(m => m.id === memberId);
                    if (!member) return null;
                    return (
                      <Tag key={memberId} color="blue" style={{ margin: 0, fontSize: '12px' }}>
                        {member.name}
                      </Tag>
                    );
                  })}
                </div>
              </Card>
            </Col>
          </Row>

          {/* 프로젝트 정보 & 워터폴 단계 */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="프로젝트 상세 정보" bordered={false} style={{ height: '100%', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Descriptions column={1} labelStyle={{ width: '140px', color: '#8c8c8c' }} contentStyle={{ fontWeight: 500 }}>
                  <Descriptions.Item label={<Space><EditOutlined /> 프로젝트명</Space>}>
                    {project.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CheckCircleOutlined /> 설명</Space>}>
                    {project.description}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CalendarOutlined /> 시작일</Space>}>
                    {dayjs(project.startDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CalendarOutlined /> 종료일</Space>}>
                    {dayjs(project.endDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CalendarOutlined /> 남은 기간</Space>}>
                    {daysRemaining > 0 ? (
                      <Tag color="blue">{daysRemaining}일 남음</Tag>
                    ) : (
                      <Tag color="red">기한 초과</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><DollarOutlined /> 총 예산</Space>}>
                    {project.budget.toLocaleString()} 원
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><DollarOutlined /> 현재 지출</Space>}>
                    <span style={{ color: budgetUsagePercent > 100 ? '#ff4d4f' : 'inherit' }}>
                      {project.spentBudget.toLocaleString()} 원
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="단계별 진행 현황" bordered={false} style={{ height: '100%', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Timeline
                  items={waterfallPhases.map((phase) => ({
                    color: phase.progress === 100 ? 'green' : phase.progress > 0 ? 'blue' : 'gray',
                    children: (
                      <div style={{ paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500 }}>{phase.name}</span>
                          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{phase.progress}%</span>
                        </div>
                        <Progress
                          percent={phase.progress}
                          size="small"
                          showInfo={false}
                          status={phase.progress === 100 ? 'success' : 'active'}
                          strokeColor={phase.progress === 100 ? '#52c41a' : '#1890ff'}
                        />
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>

          {/* 작업 현황 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="작업 현황">
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic title="전체" value={taskStats.total} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic title="할 일" value={taskStats.todo} valueStyle={{ color: '#8c8c8c' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic title="진행중" value={taskStats.inProgress} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic title="검토중" value={taskStats.review} valueStyle={{ color: '#faad14' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic title="완료" value={taskStats.done} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} lg={4}>
                    <Card size="small">
                      <Statistic
                        title="완료율"
                        value={taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'tasks',
      label: `작업 관리 (${projectTasks.length})`,
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>작업 목록</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
              작업 추가
            </Button>
          </div>
          <Table
            columns={taskColumns}
            dataSource={projectTasks}
            rowKey="id"
            pagination={{ pageSize: 10, showTotal: (total) => `총 ${total}개` }}
            scroll={{ x: 1000 }}
          />
        </Card>
      ),
    },
    {
      key: 'gantt',
      label: '간트 차트',
      children: (
        <Card title="프로젝트 일정">
          {renderGanttChart()}
        </Card>
      )
    },
    {
      key: 'team',
      label: '팀 관리',
      children: renderTeamTab()
    },
    {
      key: 'files',
      label: '파일',
      children: renderFilesTab()
    },
    {
      key: 'activity',
      label: '활동',
      children: renderActivityTab()
    }
  ];

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects')}
          style={{ marginBottom: 16 }}
        >
          프로젝트 목록
        </Button>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>{project.name}</h1>
            <Space style={{ marginTop: 8 }}>
              <Tag color={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Tag>
              <Tag color={priorityColors[project.priority]}>
                {priorityLabels[project.priority]}
              </Tag>
              {project.methodology && <Tag>{methodologyLabels[project.methodology]}</Tag>}
            </Space>
          </div>
        </Space>
      </div>

      {/* 탭 */}
      <Tabs items={tabItems} />

      {/* 작업 추가/수정 모달 */}
      <TaskModal
        open={isTaskModalOpen}
        onOk={handleTaskOk}
        onCancel={handleTaskCancel}
        initialValues={editingTask}
        title={editingTask ? '작업 수정' : '새 작업 추가'}
        okText={editingTask ? '수정' : '추가'}
      />
    </div>
  );
};

export default ProjectDetail;
