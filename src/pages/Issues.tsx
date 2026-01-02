import React, { useState, useMemo } from 'react';
import {
  Card, Table, Button, Space, Tag, Avatar, Input, Select, Segmented, Row, Col, Statistic, Typography, Tooltip, Popconfirm, Badge, Empty, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, BugOutlined, BulbOutlined, RiseOutlined, QuestionCircleOutlined, CheckSquareOutlined,
  DeleteOutlined, AppstoreOutlined, BarsOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, FireOutlined, AreaChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import {
  useIssueStore, IssueType, IssueStatus, IssuePriority, type Issue,
  getIssueTypeLabel, getIssueTypeColor, getIssueStatusLabel, getIssueStatusColor, getIssuePriorityLabel, getIssuePriorityColor,
} from '../store/issueStore';
import { useProjectStore, IndustryType } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import IssueModal from '../components/IssueModal';
import IssueDetailModal from '../components/IssueDetailModal';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text } = Typography;

type ViewMode = 'LIST' | 'BOARD';

const Issues: React.FC = () => {
  const { issues, labels, addIssue, updateIssue, deleteIssue } = useIssueStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { effectiveTheme } = useSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<IssueType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'ALL'>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterMyIssues, setFilterMyIssues] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Bulk Selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const isDark = effectiveTheme === 'dark';

  // Analytics Data
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'));
    return last7Days.map(date => {
      const dayIssues = issues.filter(i => dayjs(i.createdAt).format('MM-DD') === date);
      return {
        date,
        total: dayIssues.length,
        solved: dayIssues.filter(i => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED).length,
      };
    });
  }, [issues]);

  const industryConfig: Record<IndustryType, any> = {
    [IndustryType.SOFTWARE]: {
      title: '소프트웨어 이슈 트래커',
      subtitle: '팀의 기술적 이슈와 피드백을 한 곳에서 관리하세요',
      bugLabel: '버그',
      bugIcon: <BugOutlined />,
    },
    [IndustryType.MANUFACTURING]: {
      title: '제조 공정 이슈 트래커',
      subtitle: '생산 라인, 품질 결함 및 설비 이슈를 통합 관리하세요',
      bugLabel: '결함/장애',
      bugIcon: <ExclamationCircleOutlined />,
    },
    [IndustryType.SERVICE]: {
      title: '서비스 서비스 데스크',
      subtitle: '고객 요청 및 서비스 품질 이슈를 관리하세요',
      bugLabel: '불만/오류',
      bugIcon: <QuestionCircleOutlined />,
    },
    [IndustryType.GENERAL]: {
      title: '범용 이슈 트래커',
      subtitle: '다양한 분야의 현안과 이슈를 체계적으로 관리하세요',
      bugLabel: '일반 이슈',
      bugIcon: <BarsOutlined />,
    },
  };

  const currentIndustry = useMemo(() => {
    if (filterProject === 'ALL') return IndustryType.GENERAL;
    const project = projects.find(p => p.id === filterProject);
    return project?.industry || IndustryType.GENERAL;
  }, [filterProject, projects]);

  const config = industryConfig[currentIndustry];

  const typeDistribution = useMemo(() => {
    return Object.values(IssueType).map(type => ({
      name: getIssueTypeLabel(type, currentIndustry),
      value: issues.filter(i => i.type === type).length,
    }));
  }, [issues, currentIndustry]);

  const colors = {
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#303030' : '#f0f0f0',
    columnBg: isDark ? '#141414' : '#f5f5f5',
    primary: isDark ? '#177ddc' : '#1890ff',
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchText && !issue.title.toLowerCase().includes(searchText.toLowerCase()) && !issue.metadata?.lineId?.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterType !== 'ALL' && issue.type !== filterType) return false;
      if (filterStatus !== 'ALL' && issue.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (filterProject !== 'ALL' && issue.projectId !== filterProject) return false;
      if (filterMyIssues && issue.assigneeId !== 'member-1') return false; // member-1 is the current user
      return true;
    });
  }, [issues, searchText, filterType, filterStatus, filterPriority, filterProject, filterMyIssues]);

  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED).length;
    const inProgress = issues.filter((i) => i.status === IssueStatus.IN_PROGRESS).length;
    const resolved = issues.filter((i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED).length;
    const bugs = issues.filter((i) => i.type === IssueType.BUG || i.type === IssueType.DEFECT).length;
    const critical = issues.filter((i) => i.priority === IssuePriority.CRITICAL && i.status !== IssueStatus.CLOSED).length;

    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { open, inProgress, resolved, bugs, critical, total, resolveRate };
  }, [issues]);

  const getTypeIcon = (type: IssueType) => {
    const style = { color: getIssueTypeColor(type) };
    switch (type) {
      case IssueType.BUG: return <BugOutlined style={style} />;
      case IssueType.FEATURE: return <BulbOutlined style={style} />;
      case IssueType.IMPROVEMENT: return <RiseOutlined style={style} />;
      case IssueType.QUESTION: return <QuestionCircleOutlined style={style} />;
      case IssueType.TASK: return <CheckSquareOutlined style={style} />;
      case IssueType.DEFECT: return <ExclamationCircleOutlined style={style} />;
      case IssueType.EQUIPMENT: return <SyncOutlined style={style} />;
      case IssueType.SAFETY: return <FireOutlined style={{ color: '#f5222d' }} />;
      case IssueType.QUALITY: return <CheckCircleOutlined style={style} />;
    }
  };


  const handleAdd = () => {
    setEditingIssue(null);
    if (filterProject !== 'ALL') {
      setEditingIssue({ projectId: filterProject } as any);
    }
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    const assignee = members.find((m) => m.id === values.assigneeId);
    if (editingIssue) {
      updateIssue(editingIssue.id, { ...values, assigneeName: assignee?.name });
      message.success('이슈가 수정되었습니다.');
    } else {
      addIssue({
        ...values,
        reporterId: 'member-1', // 임시 사용자 ID (auth 연동 전)
        reporterName: '관리자',
        assigneeName: assignee?.name,
        labels: values.labels || [],
      });
      message.success('이슈가 등록되었습니다.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteIssue(id);
    setSelectedRowKeys(prev => prev.filter(k => k !== id));
    message.success('이슈가 삭제되었습니다.');
  };

  const handleBulkDelete = () => {
    const ids = selectedRowKeys.map(k => k.toString());
    useIssueStore.getState().bulkDeleteIssues(ids);
    setSelectedRowKeys([]);
    message.success(`${ids.length}개의 이슈가 삭제되었습니다.`);
  };

  const handleBulkStatusChange = (status: IssueStatus) => {
    const ids = selectedRowKeys.map(k => k.toString());
    useIssueStore.getState().bulkUpdateIssues(ids, { status });
    setSelectedRowKeys([]);
    message.success(`${ids.length}개의 이슈 상태가 변경되었습니다.`);
  };

  const handleView = (issue: Issue) => { setSelectedIssue(issue); setIsDetailOpen(true); };
  const handleEdit = (issue: Issue) => { setEditingIssue(issue); setIsDetailOpen(false); setIsModalOpen(true); };

  const columns = [
    {
      title: '타입', dataIndex: 'type', key: 'type', width: 100,
      render: (type: IssueType, record: Issue) => {
        const project = projects.find(p => p.id === record.projectId);
        return (
          <Space>
            {getTypeIcon(type)}
            <span style={{ fontSize: 12 }}>{getIssueTypeLabel(type, project?.industry)}</span>
          </Space>
        );
      },
    },
    {
      title: '제목', dataIndex: 'title', key: 'title',
      render: (title: string, record: Issue) => {
        const issueLabels = labels.filter((l) => record.labels.includes(l.id));
        return (
          <div style={{ cursor: 'pointer' }} onClick={() => handleView(record)}>
            <Text strong style={{ color: colors.text }}>{title}</Text>
            {record.metadata?.lineId && (
              <Tag style={{ marginLeft: 8, fontSize: 10 }}>Line: {record.metadata.lineId}</Tag>
            )}
            <div style={{ marginTop: 4 }}>
              {issueLabels.map((label) => (
                <Tag key={label.id} style={{ fontSize: 10, padding: '0 6px', background: `${label.color}10`, color: label.color, borderRadius: 10, border: `1px solid ${label.color}30` }}>
                  {label.category ? `[${label.category}] ` : ''}{label.name}
                </Tag>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      title: '상태', dataIndex: 'status', key: 'status', width: 100,
      render: (status: IssueStatus, record: Issue) => {
        const project = projects.find(p => p.id === record.projectId);
        return <Badge color={getIssueStatusColor(status)} text={<span style={{ color: colors.textSecondary }}>{getIssueStatusLabel(status, project?.industry)}</span>} />;
      },
    },
    {
      title: '우선순위', dataIndex: 'priority', key: 'priority', width: 90,
      render: (priority: IssuePriority, record: Issue) => {
        const project = projects.find(p => p.id === record.projectId);
        return (
          <Tag color={getIssuePriorityColor(priority)} bordered={false} style={{ borderRadius: 4 }}>
            {getIssuePriorityLabel(priority, project?.industry)}
          </Tag>
        );
      },
    },
    {
      title: '프로젝트', dataIndex: 'projectId', key: 'projectId', width: 150,
      render: (projectId: string) => <Text style={{ color: colors.textSecondary }}>{projects.find((p) => p.id === projectId)?.name || '-'}</Text>,
    },
    {
      title: '담당자', dataIndex: 'assigneeName', key: 'assignee', width: 120,
      render: (name: string) => name ? <Space><Avatar size="small" style={{ backgroundColor: isDark ? '#434343' : '#bae7ff', color: isDark ? '#bfbfbf' : '#096dd9' }}>{name[0]}</Avatar><span style={{ color: colors.textSecondary }}>{name}</span></Space> : <Text type="secondary">미지정</Text>,
    },
    {
      title: '생성일', dataIndex: 'createdAt', key: 'createdAt', width: 100,
      render: (date: Date) => <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm')}><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{dayjs(date).fromNow()}</Text></Tooltip>,
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: any, record: Issue) => (
        <Popconfirm title="이슈 삭제" description="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)} okText="삭제" cancelText="취소">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const renderBoardView = () => {
    const statusColumns = [
      { status: IssueStatus.OPEN, title: getIssueStatusLabel(IssueStatus.OPEN, currentIndustry), icon: <ExclamationCircleOutlined />, color: '#1890ff' },
      { status: IssueStatus.IN_PROGRESS, title: getIssueStatusLabel(IssueStatus.IN_PROGRESS, currentIndustry), icon: <SyncOutlined spin />, color: '#faad14' },
      { status: IssueStatus.RESOLVED, title: getIssueStatusLabel(IssueStatus.RESOLVED, currentIndustry), icon: <CheckCircleOutlined />, color: '#52c41a' },
      { status: IssueStatus.CLOSED, title: getIssueStatusLabel(IssueStatus.CLOSED, currentIndustry), icon: <ClockCircleOutlined />, color: '#8c8c8c' },
    ];

    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {statusColumns.map((col) => {
          const columnIssues = filteredIssues.filter((i) => i.status === col.status);
          return (
            <div key={col.status} style={{ minWidth: 300, maxWidth: 300, background: colors.columnBg, borderRadius: 12, padding: 16, borderTop: `4px solid ${col.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space><span style={{ color: col.color }}>{col.icon}</span><Text strong style={{ color: colors.text }}>{col.title}</Text></Space>
                <Badge count={columnIssues.length} style={{ backgroundColor: col.color }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {columnIssues.length === 0 ? <Empty description="이슈 없음" style={{ padding: 24 }} /> : columnIssues.map((issue) => {
                  const issueLabels = labels.filter((l) => issue.labels.includes(l.id));
                  return (
                    <Card key={issue.id} size="small" hoverable onClick={() => handleView(issue)}
                      style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderLeft: `4px solid ${getIssueTypeColor(issue.type)}`,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      styles={{ body: { padding: 12 } }}>
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <Space size={4}>
                          {getTypeIcon(issue.type)}
                          <Tag style={{ fontSize: 10, padding: '0 4px', background: `${getIssuePriorityColor(issue.priority)}15`, color: getIssuePriorityColor(issue.priority), border: 'none', borderRadius: 4 }}>
                            {getIssuePriorityLabel(issue.priority, currentIndustry)}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 10 }}>#{issue.id.split('-').pop()}</Text>
                      </div>
                      <Text strong style={{ display: 'block', marginBottom: 4, color: colors.text, fontSize: 13 }} ellipsis={{ tooltip: issue.title }}>{issue.title}</Text>
                      {issue.metadata?.lineId && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Line: {issue.metadata.lineId}</Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>{projects.find(p => p.id === issue.projectId)?.name}</Text>

                      {issueLabels.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          {issueLabels.slice(0, 2).map((label) => (
                            <Tag key={label.id} style={{ fontSize: 9, padding: '0 4px', background: `${label.color}10`, color: label.color, border: `1px solid ${label.color}20`, borderRadius: 10 }}>
                              {label.category ? `[${label.category}] ` : ''}{label.name}
                            </Tag>
                          ))}
                          {issueLabels.length > 2 && <Tag style={{ fontSize: 9, padding: '0 4px', borderRadius: 10 }}>+{issueLabels.length - 2}</Tag>}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                        {issue.assigneeName ? (
                          <Space size={4}>
                            <Avatar size={18} style={{ backgroundColor: isDark ? '#434343' : '#bae7ff', color: isDark ? '#bfbfbf' : '#096dd9', fontSize: 10 }}>{issue.assigneeName[0]}</Avatar>
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{issue.assigneeName}</Text>
                          </Space>
                        ) : <Avatar size={18} icon={<QuestionCircleOutlined />} />}
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>{dayjs(issue.createdAt).fromNow()}</Text>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24 }}>
      {/* Header section with Industry Selector */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{config.title}</Title>
          <Text type="secondary">{config.subtitle}</Text>
        </div>
        <Space size="middle">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>새 이슈 등록</Button>
        </Space>
      </div>

      {/* Stats Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: '전체', value: stats.total, icon: <BarsOutlined />, color: colors.textSecondary },
          { title: '활성', value: stats.open + stats.inProgress, icon: <ExclamationCircleOutlined />, color: '#1890ff' },
          { title: config.bugLabel, value: stats.bugs, icon: config.bugIcon, color: '#f5222d' }, // Use industry specific icon
          { title: '긴급', value: stats.critical, icon: <FireOutlined />, color: '#cf1322' },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <Card style={{ background: colors.cardBg, borderColor: colors.border, borderRadius: 12 }}>
              <Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Analytics Visualization Section */}
      {showAnalytics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={16}>
            <Card title="이슈 트렌드" size="small" style={{ background: colors.cardBg, borderColor: colors.border, borderRadius: 12 }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="total" name="발생" stroke={colors.primary} fill={colors.primary} fillOpacity={0.1} />
                    <Area type="monotone" dataKey="solved" name="해결" stroke="#52c41a" strokeDasharray="5 5" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="유형 분포" size="small" style={{ background: colors.cardBg, borderColor: colors.border, borderRadius: 12 }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill={colors.primary}>
                      {typeDistribution.map((_, i) => <Cell key={i} fill={['#f5222d', '#722ed1', '#1890ff', '#faad14', '#52c41a', '#eb2f96'][i % 6]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16, background: colors.cardBg, borderColor: colors.border, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small" wrap>
            <Input
              prefix={<SearchOutlined />}
              placeholder="제목 또는 메타데이터 검색..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 110 }}
              placeholder="타입"
              options={[{ value: 'ALL', label: '모든 타입' }, ...Object.values(IssueType).map(t => ({ value: t, label: getIssueTypeLabel(t) }))]}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 110 }}
              placeholder="상태"
              options={[{ value: 'ALL', label: '모든 상태' }, ...Object.values(IssueStatus).map(s => ({ value: s, label: getIssueStatusLabel(s) }))]}
            />
            <Select
              value={filterPriority}
              onChange={setFilterPriority}
              style={{ width: 110 }}
              placeholder="우선순위"
              options={[{ value: 'ALL', label: '모든 우선순위' }, ...Object.values(IssuePriority).map(p => ({ value: p, label: getIssuePriorityLabel(p) }))]}
            />
            <Select
              value={filterProject}
              onChange={setFilterProject}
              style={{ width: 130 }}
              placeholder="프로젝트"
              options={[{ value: 'ALL', label: '전체 프로젝트' }, ...projects.map(p => ({ value: p.id, label: p.name }))]}
            />
            <Button
              type={filterMyIssues ? 'primary' : 'default'}
              onClick={() => setFilterMyIssues(!filterMyIssues)}
            >
              내 이슈
            </Button>
          </Space>
          <Space>
            <Button
              icon={<AreaChartOutlined />}
              onClick={() => setShowAnalytics(!showAnalytics)}
              type={showAnalytics ? 'primary' : 'default'}
            >
              통계
            </Button>
            <Segmented
              value={viewMode}
              onChange={v => setViewMode(v as ViewMode)}
              options={[{ value: 'LIST', icon: <BarsOutlined />, label: '목록' }, { value: 'BOARD', icon: <AppstoreOutlined />, label: '보드' }]}
            />
          </Space>
        </div>
      </Card>

      {/* Main Content Area: Board or List View */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'LIST' ? (
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12 }}>
            <Table
              rowSelection={{ selectedRowKeys, onChange: k => setSelectedRowKeys(k) }}
              columns={columns}
              dataSource={filteredIssues}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          </div>
        ) : renderBoardView()}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedRowKeys.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: isDark ? '#262626' : '#fff',
          padding: '12px 24px', borderRadius: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: `1px solid ${colors.primary}`,
          display: 'flex', alignItems: 'center', gap: 20
        }}>
          <Text strong><Text style={{ color: colors.primary }}>{selectedRowKeys.length}</Text>개 선택됨</Text>
          <Space>
            <Select
              placeholder="상태 변경"
              style={{ width: 110 }}
              size="small"
              onChange={handleBulkStatusChange}
              options={Object.values(IssueStatus).map(s => ({ value: s, label: getIssueStatusLabel(s) }))}
            />
            <Button size="small" danger type="text" onClick={handleBulkDelete}>일괄 삭제</Button>
            <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>취소</Button>
          </Space>
        </div>
      )}

      {/* Modals */}
      <IssueModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        initialValues={editingIssue}
      />
      <IssueDetailModal
        open={isDetailOpen}
        issue={selectedIssue}
        onCancel={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default Issues;
