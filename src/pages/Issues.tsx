import React, { useState, useMemo } from 'react';
import {
  Card, Table, Button, Space, Tag, Avatar, Input, Select, Segmented, Row, Col, Statistic, Typography, Tooltip, Popconfirm, Badge, Empty, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, BugOutlined, BulbOutlined, RiseOutlined, QuestionCircleOutlined, CheckSquareOutlined,
  DeleteOutlined, EyeOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import {
  useIssueStore, IssueType, IssueStatus, IssuePriority, type Issue,
  getIssueTypeLabel, getIssueTypeColor, getIssueStatusLabel, getIssueStatusColor, getIssuePriorityLabel, getIssuePriorityColor,
} from '../store/issueStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import IssueModal from '../components/IssueModal';
import IssueDetailModal from '../components/IssueDetailModal';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text } = Typography;

type ViewMode = 'LIST' | 'BOARD';

const Issues: React.FC = () => {
  const { issues, labels, addIssue, updateIssue, deleteIssue } = useIssueStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { effectiveTheme, settings } = useSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<IssueType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'ALL'>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const isDark = effectiveTheme === 'dark';
  const colors = {
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#303030' : '#f0f0f0',
    columnBg: isDark ? '#141414' : '#f5f5f5',
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchText && !issue.title.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterType !== 'ALL' && issue.type !== filterType) return false;
      if (filterStatus !== 'ALL' && issue.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && issue.priority !== filterPriority) return false;
      if (filterProject !== 'ALL' && issue.projectId !== filterProject) return false;
      if (filterAssignee !== 'ALL' && issue.assigneeId !== filterAssignee) return false;
      return true;
    });
  }, [issues, searchText, filterType, filterStatus, filterPriority, filterProject, filterAssignee]);

  const stats = useMemo(() => {
    const open = issues.filter((i) => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED).length;
    const inProgress = issues.filter((i) => i.status === IssueStatus.IN_PROGRESS).length;
    const resolved = issues.filter((i) => i.status === IssueStatus.RESOLVED).length;
    const bugs = issues.filter((i) => i.type === IssueType.BUG).length;
    const critical = issues.filter((i) => i.priority === IssuePriority.CRITICAL && i.status !== IssueStatus.CLOSED).length;
    return { open, inProgress, resolved, bugs, critical, total: issues.length };
  }, [issues]);

  const getTypeIcon = (type: IssueType) => {
    const style = { color: getIssueTypeColor(type) };
    switch (type) {
      case IssueType.BUG: return <BugOutlined style={style} />;
      case IssueType.FEATURE: return <BulbOutlined style={style} />;
      case IssueType.IMPROVEMENT: return <RiseOutlined style={style} />;
      case IssueType.QUESTION: return <QuestionCircleOutlined style={style} />;
      case IssueType.TASK: return <CheckSquareOutlined style={style} />;
    }
  };

  const handleAdd = () => { setEditingIssue(null); setIsModalOpen(true); };

  const handleSave = (values: any) => {
    const currentUser = members[0];
    const assignee = members.find((m) => m.id === values.assigneeId);
    if (editingIssue) {
      updateIssue(editingIssue.id, { ...values, assigneeName: assignee?.name });
      message.success('이슈가 수정되었습니다.');
    } else {
      addIssue({
        ...values,
        reporterId: currentUser?.id || 'unknown',
        reporterName: currentUser?.name || '사용자',
        assigneeName: assignee?.name,
        labels: values.labels || [],
      });
      message.success('이슈가 등록되었습니다.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => { deleteIssue(id); message.success('이슈가 삭제되었습니다.'); };
  const handleView = (issue: Issue) => { setSelectedIssue(issue); setIsDetailOpen(true); };
  const handleEdit = (issue: Issue) => { setEditingIssue(issue); setIsDetailOpen(false); setIsModalOpen(true); };

  const columns = [
    {
      title: '타입', dataIndex: 'type', key: 'type', width: 100,
      render: (type: IssueType) => <Space>{getTypeIcon(type)}<span style={{ fontSize: 12 }}>{getIssueTypeLabel(type)}</span></Space>,
    },
    {
      title: '제목', dataIndex: 'title', key: 'title',
      render: (title: string, record: Issue) => {
        const issueLabels = labels.filter((l) => record.labels.includes(l.id));
        return (
          <div>
            <a onClick={() => handleView(record)} style={{ fontWeight: 500, color: colors.text }}>{title}</a>
            <div style={{ marginTop: 4 }}>
              {issueLabels.map((label) => (
                <Tag key={label.id} style={{ fontSize: 10, padding: '0 6px', background: `${label.color}15`, color: label.color, border: 'none' }}>{label.name}</Tag>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      title: '상태', dataIndex: 'status', key: 'status', width: 100,
      render: (status: IssueStatus) => <Tag style={{ background: `${getIssueStatusColor(status)}15`, color: getIssueStatusColor(status), border: 'none' }}>{getIssueStatusLabel(status)}</Tag>,
    },
    {
      title: '우선순위', dataIndex: 'priority', key: 'priority', width: 90,
      render: (priority: IssuePriority) => <Tag style={{ background: `${getIssuePriorityColor(priority)}15`, color: getIssuePriorityColor(priority), border: 'none' }}>{getIssuePriorityLabel(priority)}</Tag>,
    },
    {
      title: '프로젝트', dataIndex: 'projectId', key: 'projectId', width: 150,
      render: (projectId: string) => <Text style={{ color: colors.textSecondary }}>{projects.find((p) => p.id === projectId)?.name || '-'}</Text>,
    },
    {
      title: '담당자', dataIndex: 'assigneeName', key: 'assignee', width: 120,
      render: (name: string) => name ? <Space><Avatar size="small" style={{ backgroundColor: settings.primaryColor }}>{name[0]}</Avatar><span>{name}</span></Space> : <Text type="secondary">미지정</Text>,
    },
    {
      title: '생성일', dataIndex: 'createdAt', key: 'createdAt', width: 100,
      render: (date: Date) => <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm')}><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{dayjs(date).fromNow()}</Text></Tooltip>,
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_: any, record: Issue) => (
        <Space>
          <Tooltip title="상세보기"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} /></Tooltip>
          <Popconfirm title="이슈 삭제" description="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)} okText="삭제" cancelText="취소">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderBoardView = () => {
    const statusColumns = [
      { status: IssueStatus.OPEN, title: '열림', icon: <ExclamationCircleOutlined />, color: '#1890ff' },
      { status: IssueStatus.IN_PROGRESS, title: '진행중', icon: <SyncOutlined spin />, color: '#faad14' },
      { status: IssueStatus.RESOLVED, title: '해결됨', icon: <CheckCircleOutlined />, color: '#52c41a' },
      { status: IssueStatus.CLOSED, title: '종료', icon: <ClockCircleOutlined />, color: '#8c8c8c' },
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
                      style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderLeft: `4px solid ${getIssueTypeColor(issue.type)}` }}
                      styles={{ body: { padding: 12 } }}>
                      <div style={{ marginBottom: 8 }}>
                        <Space size={4}>
                          {getTypeIcon(issue.type)}
                          <Tag style={{ fontSize: 10, padding: '0 4px', background: `${getIssuePriorityColor(issue.priority)}15`, color: getIssuePriorityColor(issue.priority), border: 'none' }}>{getIssuePriorityLabel(issue.priority)}</Tag>
                        </Space>
                      </div>
                      <Text strong style={{ display: 'block', marginBottom: 8, color: colors.text, fontSize: 13 }} ellipsis={{ tooltip: issue.title }}>{issue.title}</Text>
                      {issueLabels.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {issueLabels.slice(0, 2).map((label) => <Tag key={label.id} style={{ fontSize: 10, padding: '0 4px', background: `${label.color}15`, color: label.color, border: 'none' }}>{label.name}</Tag>)}
                          {issueLabels.length > 2 && <Tag style={{ fontSize: 10, padding: '0 4px' }}>+{issueLabels.length - 2}</Tag>}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {issue.assigneeName ? <Avatar size="small" style={{ backgroundColor: settings.primaryColor }}>{issue.assigneeName[0]}</Avatar> : <Avatar size="small" icon={<BugOutlined />} />}
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{dayjs(issue.createdAt).fromNow()}</Text>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>이슈 트래커</Title>
            <Text type="secondary">버그, 기능 요청, 개선 사항을 추적하고 관리합니다</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}>새 이슈</Button>
        </div>
        <Row gutter={16}>
          {[
            { title: '전체', value: stats.total, color: colors.text },
            { title: '열림', value: stats.open, color: '#1890ff' },
            { title: '진행중', value: stats.inProgress, color: '#faad14' },
            { title: '해결됨', value: stats.resolved, color: '#52c41a' },
            { title: '버그', value: stats.bugs, color: '#f5222d', prefix: <BugOutlined /> },
            { title: '긴급', value: stats.critical, color: '#ff4d4f', prefix: <ExclamationCircleOutlined /> },
          ].map((stat, idx) => (
            <Col span={4} key={idx}>
              <Card size="small" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <Statistic title={<Text style={{ color: colors.textSecondary }}>{stat.title}</Text>} value={stat.value} prefix={stat.prefix} valueStyle={{ color: stat.color }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Card style={{ marginBottom: 16, background: colors.cardBg, border: `1px solid ${colors.border}` }} styles={{ body: { padding: '12px 16px' } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input prefix={<SearchOutlined style={{ color: colors.textSecondary }} />} placeholder="이슈 검색..." style={{ width: 200 }} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
            <div style={{ width: 1, height: 24, background: colors.border }} />
            <FilterOutlined style={{ color: colors.textSecondary }} />
            <Select value={filterType} onChange={setFilterType} style={{ width: 120 }} options={[{ value: 'ALL', label: '전체 타입' }, ...Object.values(IssueType).map((t) => ({ value: t, label: getIssueTypeLabel(t) }))]} />
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 120 }} options={[{ value: 'ALL', label: '전체 상태' }, ...Object.values(IssueStatus).map((s) => ({ value: s, label: getIssueStatusLabel(s) }))]} />
            <Select value={filterPriority} onChange={setFilterPriority} style={{ width: 130 }} options={[{ value: 'ALL', label: '전체 우선순위' }, ...Object.values(IssuePriority).map((p) => ({ value: p, label: getIssuePriorityLabel(p) }))]} />
            <Select value={filterProject} onChange={setFilterProject} style={{ width: 150 }} options={[{ value: 'ALL', label: '전체 프로젝트' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
            <Select value={filterAssignee} onChange={setFilterAssignee} style={{ width: 130 }} options={[{ value: 'ALL', label: '전체 담당자' }, ...members.map((m) => ({ value: m.id, label: m.name }))]} />
          </Space>
          <Segmented value={viewMode} onChange={(val) => setViewMode(val as ViewMode)} options={[{ value: 'LIST', icon: <BarsOutlined />, label: '리스트' }, { value: 'BOARD', icon: <AppstoreOutlined />, label: '보드' }]} />
        </div>
      </Card>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'LIST' ? (
          <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }} styles={{ body: { padding: 0 } }}>
            <Table columns={columns} dataSource={filteredIssues} rowKey="id" pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `총 ${total}개` }} />
          </Card>
        ) : renderBoardView()}
      </div>

      <IssueModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handleSave} initialValues={editingIssue} title={editingIssue ? '이슈 수정' : '새 이슈 등록'} okText={editingIssue ? '수정' : '등록'} />
      <IssueDetailModal open={isDetailOpen} issue={selectedIssue} onCancel={() => setIsDetailOpen(false)} onEdit={handleEdit} />
    </div>
  );
};

export default Issues;
