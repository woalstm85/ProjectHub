import React, { useState } from 'react';
import {
  Modal, Typography, Space, Tag, Avatar, Divider, Button, Input, List, Popconfirm, Select, Empty, message, Badge, Row, Col,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, SendOutlined, DeleteOutlined, EditOutlined,
  BugOutlined, BulbOutlined, RiseOutlined, QuestionCircleOutlined, CheckSquareOutlined,
  TagOutlined, LinkOutlined, EnvironmentOutlined,
  ExclamationCircleOutlined, SyncOutlined, FireOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import {
  IndustryType,
  type Issue, IssueType, IssueStatus,
  getIssueTypeLabel, getIssueTypeColor, getIssueStatusLabel, getIssueStatusColor,
  getIssuePriorityLabel, getIssuePriorityColor, getIssueSeverityLabel, getIssueSeverityColor,
  useIssueStore,
} from '../store/issueStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface IssueDetailModalProps {
  open: boolean;
  issue: Issue | null;
  onCancel: () => void;
  onEdit: (issue: Issue) => void;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ open, issue, onCancel, onEdit }) => {
  const { effectiveTheme } = useSettings();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { labels, changeStatus, assignIssue, addComment, deleteComment, getIssueComments, industry } = useIssueStore();
  const [newComment, setNewComment] = useState('');

  const isDark = effectiveTheme === 'dark';
  const colors = {
    bg: isDark ? '#1f1f1f' : '#ffffff',
    sectionBg: isDark ? '#141414' : '#fafafa',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#303030' : '#f0f0f0',
    primary: isDark ? '#177ddc' : '#1890ff',
  };

  const industryConfigs = {
    [IndustryType.SOFTWARE]: {
      environmentLabel: '발생 환경',
      stepsLabel: '재현 시나리오',
    },
    [IndustryType.MANUFACTURING]: {
      environmentLabel: '공정/설비',
      stepsLabel: '발생 상황 상세',
    },
    [IndustryType.SERVICE]: {
      environmentLabel: '채널/환경',
      stepsLabel: '상세 정황',
    },
    [IndustryType.GENERAL]: {
      environmentLabel: '부서/장소',
      stepsLabel: '이슈 발생 경로',
    },
  };

  const config = industryConfigs[industry] || industryConfigs[IndustryType.SOFTWARE];

  if (!issue) return null;

  const project = projects.find((p) => p.id === issue.projectId);
  const issueComments = getIssueComments(issue.id);
  const issueLabels = labels.filter((l) => issue.labels.includes(l.id));

  const getTypeIcon = (type: IssueType) => {
    const style = { color: getIssueTypeColor(type), fontSize: 16 };
    switch (type) {
      case IssueType.BUG: return <BugOutlined style={style} />;
      case IssueType.FEATURE: return <BulbOutlined style={style} />;
      case IssueType.IMPROVEMENT: return <RiseOutlined style={style} />;
      case IssueType.QUESTION: return <QuestionCircleOutlined style={style} />;
      case IssueType.TASK: return <CheckSquareOutlined style={style} />;
      case IssueType.DEFECT: return <ExclamationCircleOutlined style={style} />;
      case IssueType.EQUIPMENT: return <SyncOutlined style={style} />;
      case IssueType.SAFETY: return <FireOutlined style={{ ...style, color: '#f5222d' }} />;
      case IssueType.QUALITY: return <CheckCircleOutlined style={style} />;
    }
  };

  const handleStatusChange = (newStatus: IssueStatus) => {
    changeStatus(issue.id, newStatus);
    message.success('상태가 변경되었습니다.');
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const member = members.find((m) => m.id === assigneeId);
    if (member) {
      assignIssue(issue.id, assigneeId, member.name);
      message.success('담당자가 지정되었습니다.');
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const currentUser = members[0];
    addComment({
      issueId: issue.id,
      authorId: currentUser?.id || 'unknown',
      authorName: currentUser?.name || '사용자',
      content: newComment,
    });
    setNewComment('');
    message.success('댓글이 등록되었습니다.');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    message.success('댓글이 삭제되었습니다.');
  };

  const isBugLike = ([IssueType.BUG, IssueType.DEFECT, IssueType.EQUIPMENT, IssueType.QUALITY] as string[]).includes(issue.type);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900} centered styles={{ body: { padding: 0 } }}>
      <div style={{ display: 'flex', minHeight: 600 }}>
        {/* 왼쪽: 메인 콘텐츠 */}
        <div style={{ flex: 1, padding: 32, borderRight: `1px solid ${colors.border}`, overflowY: 'auto' }}>
          <div style={{ marginBottom: 28 }}>
            <Space align="center" style={{ marginBottom: 12 }}>
              {getTypeIcon(issue.type)}
              <Tag color={getIssueTypeColor(issue.type)} style={{ borderRadius: 4, fontWeight: 600 }}>
                {getIssueTypeLabel(issue.type)}
              </Tag>
              <Text type="secondary" style={{ fontSize: 13, background: isDark ? '#262626' : '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                #{issue.id.includes('-') ? issue.id.split('-').pop() : issue.id.slice(-6)}
              </Text>
            </Space>
            <Title level={3} style={{ margin: 0, color: colors.text, fontWeight: 700, lineHeight: 1.4 }}>{issue.title}</Title>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 16, background: colors.primary, borderRadius: 2 }} />
              <Text strong style={{ fontSize: 15, color: colors.text }}>설명</Text>
            </div>
            <div style={{ padding: 20, background: colors.sectionBg, borderRadius: 12, color: colors.text, border: `1px solid ${colors.border}` }}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14 }}>{issue.description || '설명이 없습니다.'}</Paragraph>
            </div>
          </div>

          {isBugLike && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ background: isDark ? 'rgba(245,34,45,0.05)' : 'rgba(245,34,45,0.02)', padding: 24, borderRadius: 12, border: `1px dashed ${isDark ? '#434343' : '#ffccc7'}` }}>
                <Row gutter={[16, 16]}>
                  {issue.environment && (
                    <Col span={industry === IndustryType.MANUFACTURING ? 12 : 24}>
                      <Text strong style={{ display: 'block', marginBottom: 6, color: colors.text, fontSize: 14 }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#f5222d' }} />{config.environmentLabel}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{issue.environment}</Text>
                    </Col>
                  )}
                  {issue.metadata?.lineId && (
                    <Col span={12}>
                      <Text strong style={{ display: 'block', marginBottom: 6, color: colors.text, fontSize: 14 }}>
                        라인 ID
                      </Text>
                      <Tag color="purple">{issue.metadata.lineId}</Tag>
                    </Col>
                  )}
                </Row>

                {issue.stepsToReproduce && (
                  <div style={{ marginTop: 16, marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, color: colors.text, fontSize: 14 }}>{config.stepsLabel}</Text>
                    <div style={{ padding: 16, background: colors.bg, borderRadius: 8, whiteSpace: 'pre-wrap', color: colors.textSecondary, fontSize: 13, border: `1px solid ${colors.border}` }}>
                      {issue.stepsToReproduce}
                    </div>
                  </div>
                )}

                <Row gutter={16}>
                  {issue.expectedResult && (
                    <Col span={12}>
                      <Text strong style={{ display: 'block', marginBottom: 6, color: colors.text, fontSize: 14 }}>기대 결과</Text>
                      <div style={{ padding: 16, background: isDark ? 'rgba(82,196,26,0.1)' : '#f6ffed', borderRadius: 8, border: `1px solid ${isDark ? '#237804' : '#b7eb8f'}`, fontSize: 13 }}>{issue.expectedResult}</div>
                    </Col>
                  )}
                  {issue.actualResult && (
                    <Col span={12}>
                      <Text strong style={{ display: 'block', marginBottom: 6, color: colors.text, fontSize: 14 }}>실제 결과</Text>
                      <div style={{ padding: 16, background: isDark ? 'rgba(245,34,45,0.1)' : '#fff2f0', borderRadius: 8, border: `1px solid ${isDark ? '#a8071a' : '#ffccc7'}`, fontSize: 13 }}>{issue.actualResult}</div>
                    </Col>
                  )}
                </Row>
              </div>
            </div>
          )}

          <Divider style={{ margin: '24px 0' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 16, background: colors.primary, borderRadius: 2 }} />
              <Text strong style={{ fontSize: 15, color: colors.text }}>댓글 <Text type="secondary" style={{ fontWeight: 400 }}>{issueComments.length}</Text></Text>
            </div>

            {issueComments.length === 0 ? (
              <Empty description="등록된 댓글이 없습니다." style={{ margin: '32px 0' }} />
            ) : (
              <List
                dataSource={issueComments}
                renderItem={(comment) => (
                  <List.Item
                    style={{ padding: '16px 0', borderBottom: `1px solid ${colors.border}` }}
                    actions={[
                      <Popconfirm title="댓글을 삭제하시겠습니까?" onConfirm={() => handleDeleteComment(comment.id)} okText="삭제" cancelText="취소">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: isDark ? '#434343' : '#bae7ff', color: isDark ? '#a0a0a0' : '#096dd9' }}>{comment.authorName[0]}</Avatar>}
                      title={
                        <Space size={8}>
                          <Text strong style={{ color: colors.text }}>{comment.authorName}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(comment.createdAt).fromNow()}</Text>
                        </Space>
                      }
                      description={<Text style={{ color: colors.textSecondary, whiteSpace: 'pre-wrap', fontSize: 13 }}>{comment.content}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}

            <div style={{ marginTop: 24, background: colors.sectionBg, padding: 16, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요 (Markdown 지원 예정)..."
                autoSize={{ minRows: 2, maxRows: 6 }}
                style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment} disabled={!newComment.trim()} style={{ borderRadius: 6 }}>댓글 등록</Button>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 사이드바 */}
        <div style={{ width: 320, padding: 32, background: colors.sectionBg, overflowY: 'auto' }}>
          <Space direction="vertical" size={28} style={{ width: '100%' }}>
            <section>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>상태</Text>
              <Select value={issue.status} onChange={handleStatusChange} style={{ width: '100%' }}>
                {Object.values(IssueStatus).map((status) => (
                  <Select.Option key={status} value={status}>
                    <Badge color={getIssueStatusColor(status)} text={getIssueStatusLabel(status)} />
                  </Select.Option>
                ))}
              </Select>
            </section>

            <section>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>메타정보</Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>우선순위</Text>
                  <Tag color={getIssuePriorityColor(issue.priority)} bordered={false} style={{ margin: 0, width: '100%', textAlign: 'center', borderRadius: 4 }}>{getIssuePriorityLabel(issue.priority)}</Tag>
                </div>
                {issue.type === IssueType.BUG && issue.severity && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>심각도</Text>
                    <Tag color={getIssueSeverityColor(issue.severity)} bordered={false} style={{ margin: 0, width: '100%', textAlign: 'center', borderRadius: 4 }}>{getIssueSeverityLabel(issue.severity)}</Tag>
                  </div>
                )}
              </div>
            </section>

            <section>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>인물</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>담당자</Text>
                  <Select value={issue.assigneeId} onChange={handleAssigneeChange} placeholder="담당자 지정" style={{ width: '100%' }} allowClear dropdownMatchSelectWidth={false}>
                    {members.map((member) => (
                      <Select.Option key={member.id} value={member.id}>
                        <Space>
                          <Avatar size="small" style={{ backgroundColor: isDark ? '#434343' : '#bae7ff', color: isDark ? '#a0a0a0' : '#096dd9' }}>{member.name[0]}</Avatar>
                          {member.name}
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>보고자</Text>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#8c8c8c' }}>{issue.reporterName[0]}</Avatar>
                    <Text style={{ color: colors.text }}>{issue.reporterName}</Text>
                  </Space>
                </div>
              </div>
            </section>

            <section>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>연결정보</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}><LinkOutlined style={{ marginRight: 4 }} />프로젝트</Text>
                  <Text style={{ color: colors.text, fontWeight: 500 }}>{project?.name || '-'}</Text>
                </div>
                {issueLabels.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}><TagOutlined style={{ marginRight: 4 }} />라벨</Text>
                    <Space wrap size={[4, 4]}>
                      {issueLabels.map((label) => (
                        <Tag key={label.id} style={{ background: `${label.color}10`, color: label.color, border: `1px solid ${label.color}30`, borderRadius: 10, fontSize: 11, margin: 0 }}>{label.name}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            </section>

            <section>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>일정 및 히스토리</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {issue.dueDate && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}><CalendarOutlined style={{ marginRight: 4 }} />마감기한</Text>
                    <Text style={{ color: dayjs(issue.dueDate).isBefore(dayjs()) ? '#f5222d' : colors.text, fontWeight: 500 }}>{dayjs(issue.dueDate).format('YYYY-MM-DD')}</Text>
                  </div>
                )}
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  <div style={{ marginBottom: 4 }}><ClockCircleOutlined style={{ marginRight: 4 }} />생성: {dayjs(issue.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                  <div><ClockCircleOutlined style={{ marginRight: 4 }} />수정: {dayjs(issue.updatedAt).format('YYYY-MM-DD HH:mm')}</div>
                </div>
              </div>
            </section>

            <div style={{ marginTop: 12 }}>
              <Button block type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(issue)} style={{ borderRadius: 8, height: 40 }}>이슈 수정</Button>
            </div>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default IssueDetailModal;
