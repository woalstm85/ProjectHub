import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Avatar,
  Card,
  Row,
  Col,
  message,
  Segmented,
  Badge,
  Tooltip,
  Typography,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useMemberStore,
  MemberRole,
  type Member,
  type CreateMemberDTO
} from '../store/memberStore';
import { useTaskStore, TaskStatus } from '../store/taskStore';
import { useSettings } from '../store/settingsStore';

const { Title, Text } = Typography;

const Members: React.FC = () => {
  const { members, addMember, updateMember, deleteMember } = useMemberStore();
  const { tasks } = useTaskStore();
  const { effectiveTheme, settings } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'ALL'>('ALL');

  const isDark = effectiveTheme === 'dark';

  // 다크모드 색상
  const colors = {
    bg: isDark ? '#141414' : '#f0f2f5',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#404040' : '#d9d9d9',
    avatarBg: isDark ? '#2a2a2a' : '#f0f2f5',
    avatarBorder: isDark ? '#404040' : '#d9d9d9',
    tableRowHover: isDark ? '#2a2a2a' : '#fafafa',
    gridCardBg: isDark ? '#1f1f1f' : '#ffffff',
    gridCardHover: isDark ? '#2a2a2a' : '#fafafa',
    actionsBg: isDark ? '#262626' : '#fafafa',
    skillTagBg: isDark ? '#2a2a2a' : '#fafafa',
    skillTagText: isDark ? '#d0d0d0' : '#595959',
    skillTagBorder: isDark ? '#404040' : '#d9d9d9',
    statTitle: isDark ? '#a0a0a0' : '#8c8c8c',
  };

  const roleLabels: Record<MemberRole, string> = {
    [MemberRole.PROJECT_MANAGER]: '프로젝트 관리자',
    [MemberRole.DEVELOPER]: '개발자',
    [MemberRole.DESIGNER]: '디자이너',
    [MemberRole.QA]: 'QA',
    [MemberRole.ANALYST]: '분석가',
  };

  const roleColors: Record<MemberRole, string> = {
    [MemberRole.PROJECT_MANAGER]: 'purple',
    [MemberRole.DEVELOPER]: 'blue',
    [MemberRole.DESIGNER]: 'green',
    [MemberRole.QA]: 'orange',
    [MemberRole.ANALYST]: 'cyan',
  };

  const statusColors: Record<string, string> = {
    online: 'success',
    offline: 'default',
    busy: 'error',
    vacation: 'purple',
    meeting: 'warning',
  };

  const statusLabels: Record<string, string> = {
    online: '온라인',
    offline: '오프라인',
    busy: '바쁨',
    vacation: '휴가중',
    meeting: '회의중',
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assignee === memberId);
    const active = memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = memberTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, total, rate };
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchText.toLowerCase()) ||
        member.email.toLowerCase().includes(searchText.toLowerCase()) ||
        member.department?.toLowerCase().includes(searchText.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchText, roleFilter]);

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    form.setFieldsValue({
      ...member,
      joinDate: member.joinDate ? dayjs(member.joinDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingMember(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMember(id);
    message.success('팀원이 삭제되었습니다.');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        joinDate: values.joinDate ? values.joinDate.toDate() : undefined,
      };

      if (editingMember) {
        updateMember(editingMember.id, formattedValues);
        message.success('팀원 정보가 수정되었습니다.');
      } else {
        addMember({ ...formattedValues, status: 'offline' } as CreateMemberDTO);
        message.success('새로운 팀원이 추가되었습니다.');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: '프로필',
      key: 'avatar',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: Member) => (
        <Badge dot status={statusColors[record.status || 'offline'] as any} offset={[-5, 35]}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            src={record.avatar}
            style={{ backgroundColor: colors.avatarBg, border: `1px solid ${colors.avatarBorder}` }}
          />
        </Badge>
      ),
    },
    {
      title: '이름',
      key: 'name',
      dataIndex: 'name',
      render: (text: string) => (
        <div style={{ fontWeight: 600, color: colors.text }}>{text}</div>
      ),
    },
    {
      title: '이메일',
      key: 'email',
      dataIndex: 'email',
      render: (email: string) => (
        <Space>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>{email}</div>
          <Tooltip title="이메일 보내기">
            <Button
              type="text"
              size="small"
              icon={<MailOutlined />}
              onClick={() => window.location.href = `mailto:${email}`}
              style={{ color: colors.textSecondary }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '업무 부하',
      key: 'workload',
      width: 200,
      render: (_: any, record: Member) => {
        const stats = getMemberStats(record.id);
        const loadColor = stats.active > 5 ? '#ff4d4f' : stats.active > 2 ? '#faad14' : '#52c41a';
        const loadLabel = stats.active > 5 ? '과부하' : stats.active > 2 ? '보통' : '여유';

        return (
          <div style={{ width: '100%', paddingRight: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: colors.textSecondary }}>{loadLabel}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: loadColor }}>{stats.active}건</span>
            </div>
            <div style={{ height: 6, background: isDark ? '#333' : '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (stats.active / 8) * 100)}%`,
                  background: loadColor,
                  borderRadius: 3,
                  transition: 'all 0.3s',
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: '역할 / 부서',
      key: 'role',
      width: 180,
      render: (_: any, record: Member) => (
        <Space direction="vertical" size={2}>
          <Tag color={roleColors[record.role]} style={{ margin: 0 }}>{roleLabels[record.role]}</Tag>
          {record.department && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{record.department}</Text>}
        </Space>
      ),
    },
    {
      title: '기술 스택',
      key: 'skills',
      render: (_: any, record: Member) => (
        <Space size={[0, 4]} wrap>
          {record.skills?.map(skill => (
            <Tag
              key={skill}
              style={{
                fontSize: 11,
                background: colors.skillTagBg,
                color: colors.skillTagText,
                border: `1px solid ${colors.skillTagBorder}`,
              }}
            >
              {skill}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '작업 현황',
      key: 'stats',
      render: (_: any, record: Member) => {
        const stats = getMemberStats(record.id);
        return (
          <Space size="large">
            <Tooltip title="진행중인 작업">
              <Space size={4}>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ color: colors.text }}>{stats.active}</span>
              </Space>
            </Tooltip>
            <Tooltip title="완료된 작업">
              <Space size={4}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span style={{ color: colors.text }}>{stats.completed}</span>
              </Space>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: '관리',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: Member) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined style={{ color: colors.textSecondary }} />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="팀원 삭제"
            description="정말 이 팀원을 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>팀원 관리</Title>
          <Text type="secondary">프로젝트 멤버들의 역할, 기술, 업무 현황을 관리합니다.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          팀원 추가
        </Button>
      </div>

      {/* Filters & Controls */}
      <Card
        style={{
          marginBottom: 24,
          background: colors.cardBg,
          border: isDark ? `1px solid ${colors.border}` : 'none',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size="middle">
              <Input
                prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
                placeholder="이름, 이메일, 부서 검색"
                style={{ width: 250 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <Select
                defaultValue="ALL"
                style={{ width: 150 }}
                onChange={(val) => setRoleFilter(val as MemberRole | 'ALL')}
                options={[
                  { value: 'ALL', label: '모든 역할' },
                  ...Object.entries(roleLabels).map(([key, label]) => ({ value: key, label }))
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Segmented
              options={[
                { value: 'list', icon: <BarsOutlined /> },
                { value: 'grid', icon: <AppstoreOutlined /> },
              ]}
              value={viewMode}
              onChange={(val: any) => setViewMode(val)}
            />
          </Col>
        </Row>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            background: colors.cardBg,
            border: isDark ? `1px solid ${colors.border}` : 'none',
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredMembers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredMembers.map(member => {
            const stats = getMemberStats(member.id);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={member.id}>
                <Card
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: colors.gridCardBg,
                    border: isDark ? `1px solid ${colors.border}` : '1px solid #f0f0f0',
                    transition: 'all 0.2s',
                  }}
                  hoverable
                  styles={{
                    body: { padding: 20, flex: 1 },
                    actions: {
                      background: colors.actionsBg,
                      borderTop: `1px solid ${colors.border}`,
                    },
                  }}
                  actions={[
                    <Tooltip title="이메일 보내기">
                      <MailOutlined key="mail" onClick={() => window.location.href = `mailto:${member.email}`} style={{ color: colors.textSecondary }} />
                    </Tooltip>,
                    <EditOutlined key="edit" onClick={() => handleEdit(member)} style={{ color: colors.textSecondary }} />,
                    <Popconfirm
                      title="삭제"
                      description="삭제하시겠습니까?"
                      onConfirm={() => handleDelete(member.id)}
                    >
                      <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                    </Popconfirm>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Badge dot status={statusColors[member.status || 'offline'] as any} offset={[-5, 35]}>
                        <Avatar
                          src={member.avatar}
                          icon={<UserOutlined />}
                          size={48}
                          style={{ backgroundColor: colors.avatarBg, border: `1px solid ${colors.avatarBorder}` }}
                        />
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.text }}>{member.name}</span>
                        <Tag color={roleColors[member.role]} style={{ margin: 0, fontSize: 10 }}>{roleLabels[member.role]}</Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{member.email}</Text>
                        <div style={{ marginTop: 8 }}>
                          {member.skills?.slice(0, 3).map(skill => (
                            <Tag
                              key={skill}
                              style={{
                                fontSize: 10,
                                background: colors.skillTagBg,
                                color: colors.skillTagText,
                                border: `1px solid ${colors.skillTagBorder}`,
                              }}
                            >
                              {skill}
                            </Tag>
                          ))}
                          {(member.skills?.length || 0) > 3 && (
                            <Tag
                              style={{
                                fontSize: 10,
                                background: colors.skillTagBg,
                                color: colors.skillTagText,
                                border: `1px solid ${colors.skillTagBorder}`,
                              }}
                            >
                              +{member.skills!.length - 3}
                            </Tag>
                          )}
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: colors.textSecondary }}>업무 부하</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: stats.active > 5 ? '#ff4d4f' : stats.active > 2 ? '#faad14' : '#52c41a' }}>
                              {stats.active > 5 ? '과부하' : stats.active > 2 ? '보통' : '여유'}
                            </span>
                          </div>
                          <div style={{ height: 6, background: isDark ? '#333' : '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, (stats.active / 8) * 100)}%`,
                                background: stats.active > 5 ? '#ff4d4f' : stats.active > 2 ? '#faad14' : '#52c41a',
                                borderRadius: 3,
                                transition: 'all 0.3s',
                              }}
                            />
                          </div>
                        </div>
                        <Row gutter={8} style={{ marginTop: 12, textAlign: 'center' }}>
                          <Col span={12}>
                            <Statistic
                              title={<span style={{ fontSize: 11, color: colors.statTitle }}>진행중</span>}
                              value={stats.active}
                              valueStyle={{ fontSize: 16, color: '#1890ff' }}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic
                              title={<span style={{ fontSize: 11, color: colors.statTitle }}>완료율</span>}
                              value={stats.rate}
                              suffix="%"
                              valueStyle={{ fontSize: 16, color: '#52c41a' }}
                            />
                          </Col>
                        </Row>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal */}
      <Modal
        title={editingMember ? '팀원 수정' : '팀원 추가'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="이름" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} placeholder="이름" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="역할" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="이메일" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="연락처">
                <Input prefix={<PhoneOutlined />} placeholder="010-0000-0000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="joinDate" label="입사일">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="부서">
                <Input prefix={<IdcardOutlined />} placeholder="부서명" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="상태">
                <Select>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      <Badge status={statusColors[key] as any} text={label} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="skills" label="기술 스택">
            <Select mode="tags" placeholder="기술 스택 입력 (Enter로 추가)" tokenSeparators={[',']} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 다크모드 테이블 스타일 */}
      <style>{`
        .ant-table {
          background: ${colors.cardBg} !important;
        }
        .ant-table-thead > tr > th {
          background: ${isDark ? '#262626' : '#fafafa'} !important;
          color: ${colors.text} !important;
          border-bottom: 1px solid ${colors.border} !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${colors.border} !important;
          background: ${colors.cardBg} !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: ${colors.tableRowHover} !important;
        }
        .ant-table-pagination {
          background: ${colors.cardBg} !important;
        }
        .ant-card-hoverable:hover {
          border-color: ${settings.primaryColor} !important;
          box-shadow: ${isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)'} !important;
        }
        .ant-card-actions > li {
          border-inline-end: 1px solid ${colors.border} !important;
        }
        .ant-card-actions > li:last-child {
          border-inline-end: none !important;
        }
      `}</style>
    </div>
  );
};

export default Members;
