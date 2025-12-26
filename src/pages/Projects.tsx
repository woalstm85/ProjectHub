import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Popconfirm,
  Progress,
  Card,
  Row,
  Col,
  Tooltip,
  Segmented,
  Avatar,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RiseOutlined,
  AppstoreOutlined,
  BarsOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  useProjectStore,
  ProjectStatus,
  ProjectPriority,
  type Project,
  type CreateProjectDTO
} from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import ProjectModal from '../components/ProjectModal';
import { useSettings } from '../store/settingsStore';

const { Title } = Typography;

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject, toggleFavorite } = useProjectStore();
  const { members } = useMemberStore();
  const { effectiveTheme, settings } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CARD'>('CARD');

  const isDark = effectiveTheme === 'dark';

  // 검색/필터 상태
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<ProjectPriority | 'ALL'>('ALL');

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

  // 필터링된 프로젝트 목록
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // 검색어 필터
      const matchesSearch = searchText === '' ||
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.description.toLowerCase().includes(searchText.toLowerCase());

      // 상태 필터
      const matchesStatus = filterStatus === 'ALL' || project.status === filterStatus;

      // 우선순위 필터
      const matchesPriority = filterPriority === 'ALL' || project.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // 즐겨찾기 된 프로젝트를 상단으로
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [projects, searchText, filterStatus, filterPriority]);

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    updateProject(projectId, { status: newStatus });
  };

  const columns = [
    {
      title: '',
      key: 'favorite',
      width: 40,
      render: (_: any, record: Project) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(record.id);
          }}
          style={{ cursor: 'pointer', textAlign: 'center' }}
        >
          {record.isFavorite ? (
            <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
          ) : (
            <StarOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
          )}
        </div>
      ),
    },
    {
      title: '프로젝트명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Project) => (
        <a
          onClick={() => navigate(`/projects/${record.id}`)}
          style={{ fontWeight: 500, color: settings.primaryColor }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: ProjectStatus, record: Project) => (
        <Select
          value={status}
          size="small"
          bordered={false}
          onChange={(val) => handleStatusChange(record.id, val)}
          dropdownMatchSelectWidth={false}
          style={{ width: 100 }}
        >
          {Object.entries(statusLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <Tag color={statusColors[key as ProjectStatus]} style={{ margin: 0 }}>
                {label}
              </Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '우선순위',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      align: 'center' as const,
      render: (priority: ProjectPriority) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      ),
    },
    {
      title: '팀원',
      dataIndex: 'teamMembers',
      key: 'teamMembers',
      width: 180,
      render: (memberIds: string[]) => {
        if (!memberIds || memberIds.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }

        const projectMembers = members.filter(m => memberIds.includes(m.id));

        return (
          <Avatar.Group maxCount={3} size="small">
            {projectMembers.map((member) => (
              <Tooltip key={member.id} title={member.name}>
                <Avatar src={member.avatar} style={{ backgroundColor: settings.primaryColor }}>
                  {member.name[0]}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: '기간',
      key: 'period',
      width: 180,
      render: (_text: unknown, record: Project) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(record.startDate).format('YY.MM.DD')} ~ {dayjs(record.endDate).format('YY.MM.DD')}
        </span>
      ),
    },
    {
      title: (
        <Space>
          <RiseOutlined />
          진행률
        </Space>
      ),
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Tooltip title={`현재 진행률: ${progress}%`}>
          <Progress
            percent={progress}
            size="small"
            strokeColor={{
              '0%': settings.primaryColor,
              '100%': '#52c41a',
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_text: unknown, record: Project) => (
        <Space size="small">
          <Tooltip title="수정">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="프로젝트 삭제"
            description="정말 이 프로젝트를 삭제하시겠습니까?"
            onConfirm={() => deleteProject(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Tooltip title="삭제">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOk = (values: any) => {
    const projectData = {
      name: values.name,
      description: values.description,
      status: values.status,
      priority: values.priority,
      teamSize: values.teamMembers?.length || 0,
      teamMembers: values.teamMembers || [],
      startDate: values.dateRange[0].toDate(),
      endDate: values.dateRange[1].toDate(),
      budget: values.budget,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData as CreateProjectDTO);
    }

    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const renderCardView = () => {
    return (
      <Row gutter={[16, 16]}>
        {filteredProjects.map(project => {
          const projectMembers = members.filter(m => project.teamMembers.includes(m.id));
          const daysRemaining = dayjs(project.endDate).diff(dayjs(), 'day');

          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}
                actions={[
                  <Tooltip title="수정">
                    <EditOutlined key="edit" onClick={() => handleEdit(project)} />
                  </Tooltip>,
                  <Popconfirm
                    title="프로젝트 삭제"
                    onConfirm={() => deleteProject(project.id)}
                    okText="삭제"
                    cancelText="취소"
                  >
                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                  </Popconfirm>
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: settings.primaryColor
                        }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        {project.name}
                      </h3>
                      {project.isFavorite && <StarFilled style={{ color: '#faad14', fontSize: 14 }} />}
                    </div>
                    <Space size={4}>
                      <Tag color={statusColors[project.status]} style={{ margin: 0, fontSize: 10 }}>
                        {statusLabels[project.status]}
                      </Tag>
                      <Tag color={priorityColors[project.priority]} style={{ margin: 0, fontSize: 10 }}>
                        {priorityLabels[project.priority]}
                      </Tag>
                    </Space>
                  </div>
                  <Button
                    type="text"
                    icon={project.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(project.id);
                    }}
                  />
                </div>

                <p style={{
                  color: isDark ? '#a0a0a0' : '#666',
                  fontSize: 13,
                  marginBottom: 16,
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {project.description}
                </p>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: isDark ? '#a0a0a0' : '#888' }}>진행률</span>
                    <span style={{ fontWeight: 600 }}>{project.progress}%</span>
                  </div>
                  <Progress percent={project.progress} showInfo={false} size="small" strokeColor={settings.primaryColor} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <Avatar.Group maxCount={3} size="small">
                    {projectMembers.map((member) => (
                      <Tooltip key={member.id} title={member.name}>
                        <Avatar src={member.avatar} style={{ backgroundColor: settings.primaryColor }}>
                          {member.name[0]}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </Avatar.Group>

                  <Space size={4} style={{ fontSize: 12, color: isDark ? '#a0a0a0' : '#888' }}>
                    <CalendarOutlined />
                    {daysRemaining > 0 ? (
                      <span>D-{daysRemaining}</span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>기한 초과</span>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>프로젝트</Title>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'LIST' | 'CARD')}
            options={[
              { value: 'CARD', icon: <AppstoreOutlined />, label: '카드' },
              { value: 'LIST', icon: <BarsOutlined />, label: '리스트' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            프로젝트 추가
          </Button>
        </Space>
      </div>

      {/* 검색 및 필터 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="프로젝트 검색 (이름, 설명)"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="상태 필터"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Select.Option value="ALL">전체 상태</Select.Option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="우선순위 필터"
              value={filterPriority}
              onChange={setFilterPriority}
            >
              <Select.Option value="ALL">전체 우선순위</Select.Option>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {viewMode === 'LIST' ? (
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      ) : (
        renderCardView()
      )}

      <ProjectModal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        initialValues={editingProject}
        title={editingProject ? '프로젝트 수정' : '프로젝트 추가'}
        okText={editingProject ? '수정' : '추가'}
      />
    </div>
  );
};

export default Projects;