import React, { useState } from 'react';
import {
  Modal, Typography, Space, Tag, Avatar, Divider, Button, Input, List, Popconfirm, Select, Empty, message,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, SendOutlined, DeleteOutlined, EditOutlined,
  BugOutlined, BulbOutlined, RiseOutlined, QuestionCircleOutlined, CheckSquareOutlined,
  TagOutlined, LinkOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import {
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
  const { effectiveTheme, settings } = useSettings();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { labels, changeStatus, assignIssue, addComment, deleteComment, getIssueComments } = useIssueStore();
  const [newComment, setNewComment] = useState('');

  const isDark = effectiveTheme === 'dark';
  const colors = {
    bg: isDark ? '#1f1f1f' : '#ffffff',
    sectionBg: isDark ? '#141414' : '#fafafa',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#303030' : '#f0f0f0',
  };

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

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900} centered styles={{ body: { padding: 0 } }}>
      <div style={{ display: 'flex', minHeight: 600 }}>
        {/* 왼쪽: 메인 콘텐츠 */}
        <div style={{ flex: 1, padding: 24, borderRight: `1px solid ${colors.border}` }}>
          <div style={{ marginBottom: 20 }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              {getTypeIcon(issue.type)}
              <Tag style={{ background: `${getIssueTypeColor(issue.type)}15`, color: getIssueTypeColor(issue.type), border: 'none' }}>
                {getIssueTypeLabel(issue.type)}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>#{issue.id.split('-')[1]}</Text>
            </Space>
            <Title level={4} style={{ margin: 0, color: colors.text }}>{issue.title}</Title>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8, color: colors.text }}>설명</Text>
            <div style={{ padding: 16, background: colors.sectionBg, borderRadius: 8, color: colors.text }}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{issue.description || '설명이 없습니다.'}</Paragraph>
            </div>
          </div>

          {issue.type === IssueType.BUG && (
            <div style={{ marginBottom: 24 }}>
              {issue.environment && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4, color: colors.text }}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />환경
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>{issue.environment}</Text>
                </div>
              )}
              {issue.stepsToReproduce && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4, color: colors.text }}>재현 방법</Text>
                  <div style={{ padding: 12, background: colors.sectionBg, borderRadius: 8, whiteSpace: 'pre-wrap', color: colors.textSecondary, fontSize: 13 }}>
                    {issue.stepsToReproduce}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 16 }}>
                {issue.expectedResult && (
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4, color: colors.text }}>기대 결과</Text>
                    <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', fontSize: 13 }}>{issue.expectedResult}</div>
                  </div>
                )}
                {issue.actualResult && (
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4, color: colors.text }}>실제 결과</Text>
                    <div style={{ padding: 12, background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7', fontSize: 13 }}>{issue.actualResult}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Text strong style={{ display: 'block', marginBottom: 16, color: colors.text }}>댓글 ({issueComments.length})</Text>
            {issueComments.length === 0 ? (
              <Empty description="댓글이 없습니다" style={{ margin: '24px 0' }} />
            ) : (
              <List
                dataSource={issueComments}
                renderItem={(comment) => (
                  <List.Item
                    style={{ padding: '12px 0' }}
                    actions={[
                      <Popconfirm title="댓글을 삭제하시겠습니까?" onConfirm={() => handleDeleteComment(comment.id)} okText="삭제" cancelText="취소">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: settings.primaryColor }}>{comment.authorName[0]}</Avatar>}
                      title={
                        <Space>
                          <Text strong style={{ color: colors.text }}>{comment.authorName}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(comment.createdAt).fromNow()}</Text>
                        </Space>
                      }
                      description={<Text style={{ color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>{comment.content}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <TextArea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요..." autoSize={{ minRows: 2, maxRows: 4 }} style={{ flex: 1 }} />
              <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment} disabled={!newComment.trim()}>등록</Button>
            </div>
          </div>
        </div>

        {/* 오른쪽: 사이드바 */}
        <div style={{ width: 280, padding: 24, background: colors.sectionBg }}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>상태</Text>
              <Select value={issue.status} onChange={handleStatusChange} style={{ width: '100%' }}>
                {Object.values(IssueStatus).map((status) => (
                  <Select.Option key={status} value={status}>
                    <Tag style={{ background: `${getIssueStatusColor(status)}15`, color: getIssueStatusColor(status), border: 'none' }}>{getIssueStatusLabel(status)}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>우선순위</Text>
              <Tag style={{ background: `${getIssuePriorityColor(issue.priority)}15`, color: getIssuePriorityColor(issue.priority), border: 'none' }}>{getIssuePriorityLabel(issue.priority)}</Tag>
            </div>

            {issue.type === IssueType.BUG && issue.severity && (
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>심각도</Text>
                <Tag style={{ background: `${getIssueSeverityColor(issue.severity)}15`, color: getIssueSeverityColor(issue.severity), border: 'none' }}>{getIssueSeverityLabel(issue.severity)}</Tag>
              </div>
            )}

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>담당자</Text>
              <Select value={issue.assigneeId} onChange={handleAssigneeChange} placeholder="담당자 선택" style={{ width: '100%' }} allowClear>
                {members.map((member) => (
                  <Select.Option key={member.id} value={member.id}>
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: settings.primaryColor }}>{member.name[0]}</Avatar>
                      {member.name}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>보고자</Text>
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#8c8c8c' }}>{issue.reporterName[0]}</Avatar>
                <Text style={{ color: colors.text }}>{issue.reporterName}</Text>
              </Space>
            </div>

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}><LinkOutlined style={{ marginRight: 4 }} />프로젝트</Text>
              <Text style={{ color: colors.text }}>{project?.name || '-'}</Text>
            </div>

            {issueLabels.length > 0 && (
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}><TagOutlined style={{ marginRight: 4 }} />라벨</Text>
                <Space wrap>
                  {issueLabels.map((label) => (
                    <Tag key={label.id} style={{ background: `${label.color}15`, color: label.color, border: `1px solid ${label.color}40` }}>{label.name}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {issue.dueDate && (
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}><CalendarOutlined style={{ marginRight: 4 }} />마감일</Text>
                <Text style={{ color: dayjs(issue.dueDate).isBefore(dayjs()) ? '#ff4d4f' : colors.text }}>{dayjs(issue.dueDate).format('YYYY-MM-DD')}</Text>
              </div>
            )}

            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}><ClockCircleOutlined style={{ marginRight: 4 }} />일시</Text>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                <div>생성: {dayjs(issue.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                <div>수정: {dayjs(issue.updatedAt).format('YYYY-MM-DD HH:mm')}</div>
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />
            <Button block icon={<EditOutlined />} onClick={() => onEdit(issue)}>이슈 수정</Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default IssueDetailModal;
