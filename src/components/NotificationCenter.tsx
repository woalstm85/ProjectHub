import React, { useState, useEffect } from 'react';
import {
  Dropdown,
  Badge,
  Button,
  List,
  Typography,
  Tag,
  Space,
  Empty,
  Tabs,
  Avatar,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ProjectOutlined,
  UserOutlined,
  DeleteOutlined,
  CheckOutlined,
  CalendarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useTaskStore, TaskStatus } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Text } = Typography;

export interface Notification {
  id: string;
  type: 'deadline' | 'overdue' | 'assigned' | 'completed' | 'project';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  taskId?: string;
  projectId?: string;
}

const NotificationCenter: React.FC = () => {
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { settings } = useSettings();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // 알림 생성 로직
  useEffect(() => {
    if (!settings.notifications.enabled) {
      setNotifications([]);
      return;
    }

    const newNotifications: Notification[] = [];
    const now = dayjs();

    // 마감일 알림
    if (settings.notifications.deadlineReminder) {
      tasks.forEach(task => {
        if (task.status === TaskStatus.DONE || !task.dueDate) return;

        const dueDate = dayjs(task.dueDate);
        const daysLeft = dueDate.diff(now, 'day');
        const project = projects.find(p => p.id === task.projectId);

        // 지연된 작업
        if (daysLeft < 0) {
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            title: '작업 지연',
            description: `"${task.title}" 작업이 ${Math.abs(daysLeft)}일 지연되었습니다.`,
            timestamp: task.dueDate,
            read: false,
            taskId: task.id,
            projectId: task.projectId,
          });
        }
        // 마감 임박 (설정된 일수 이내)
        else if (daysLeft <= settings.notifications.deadlineDays && daysLeft >= 0) {
          newNotifications.push({
            id: `deadline-${task.id}`,
            type: 'deadline',
            title: daysLeft === 0 ? '오늘 마감' : `마감 ${daysLeft}일 전`,
            description: `"${task.title}" ${project ? `(${project.name})` : ''}`,
            timestamp: task.dueDate,
            read: false,
            taskId: task.id,
            projectId: task.projectId,
          });
        }
      });
    }

    // 최근 완료된 작업 알림 (24시간 이내)
    if (settings.notifications.taskCompleted) {
      tasks
        .filter(task => task.status === TaskStatus.DONE)
        .filter(task => dayjs(task.updatedAt).isAfter(now.subtract(24, 'hour')))
        .forEach(task => {
          const project = projects.find(p => p.id === task.projectId);
          newNotifications.push({
            id: `completed-${task.id}`,
            type: 'completed',
            title: '작업 완료',
            description: `"${task.title}" ${project ? `(${project.name})` : ''}`,
            timestamp: task.updatedAt,
            read: false,
            taskId: task.id,
            projectId: task.projectId,
          });
        });
    }

    // 정렬: 최신순 + 지연/마감임박 우선
    newNotifications.sort((a, b) => {
      // 지연된 것 최우선
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (b.type === 'overdue' && a.type !== 'overdue') return 1;
      // 그 다음 마감 임박
      if (a.type === 'deadline' && b.type !== 'deadline' && b.type !== 'overdue') return -1;
      if (b.type === 'deadline' && a.type !== 'deadline' && a.type !== 'overdue') return 1;
      // 나머지는 시간순
      return dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf();
    });

    setNotifications(newNotifications);
  }, [tasks, projects, settings.notifications]);

  // 알림 읽음 처리
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 알림 삭제
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 모두 읽음 처리
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 모두 삭제
  const clearAll = () => {
    setNotifications([]);
  };

  // 읽지 않은 알림 수
  const unreadCount = notifications.filter(n => !n.read).length;

  // 알림 아이콘 및 색상
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case 'deadline':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'assigned':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'project':
        return <ProjectOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return '#fff1f0';
      case 'deadline':
        return '#fffbe6';
      case 'completed':
        return '#f6ffed';
      case 'assigned':
        return '#e6f7ff';
      case 'project':
        return '#f9f0ff';
      default:
        return '#fafafa';
    }
  };

  // 알림 타입별 필터링
  const overdueNotifications = notifications.filter(n => n.type === 'overdue');
  const deadlineNotifications = notifications.filter(n => n.type === 'deadline');
  const otherNotifications = notifications.filter(n => !['overdue', 'deadline'].includes(n.type));

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 500,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Text strong style={{ fontSize: 16 }}>알림</Text>
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
          )}
        </Space>
        <Space size={4}>
          <Tooltip title="모두 읽음">
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            />
          </Tooltip>
          <Tooltip title="모두 삭제">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={clearAll}
              disabled={notifications.length === 0}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              settings.notifications.enabled
                ? "새로운 알림이 없습니다"
                : "알림이 비활성화되어 있습니다"
            }
          />
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {/* 지연된 작업 */}
          {overdueNotifications.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#fff1f0' }}>
                <Text type="danger" strong style={{ fontSize: 12 }}>
                  <FireOutlined /> 지연된 작업 ({overdueNotifications.length})
                </Text>
              </div>
              <List
                dataSource={overdueNotifications}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: item.read ? '#fff' : '#fff1f0',
                      borderLeft: item.read ? 'none' : '3px solid #ff4d4f',
                    }}
                    onClick={() => markAsRead(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          style={{ background: getNotificationColor(item.type) }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(item.id);
                            }}
                            style={{ opacity: 0.5 }}
                          />
                        </div>
                      }
                      description={
                        <div>
                          <Text style={{ fontSize: 12 }}>{item.description}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              마감: {dayjs(item.timestamp).format('MM.DD')}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 마감 임박 */}
          {deadlineNotifications.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#fffbe6' }}>
                <Text style={{ color: '#d48806', fontSize: 12 }} strong>
                  <ClockCircleOutlined /> 마감 임박 ({deadlineNotifications.length})
                </Text>
              </div>
              <List
                dataSource={deadlineNotifications}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: item.read ? '#fff' : '#fffbe6',
                      borderLeft: item.read ? 'none' : '3px solid #faad14',
                    }}
                    onClick={() => markAsRead(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          style={{ background: getNotificationColor(item.type) }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                            <Tag color="warning" style={{ fontSize: 10 }}>
                              {dayjs(item.timestamp).format('MM.DD')}
                            </Tag>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(item.id);
                            }}
                            style={{ opacity: 0.5 }}
                          />
                        </div>
                      }
                      description={
                        <Text style={{ fontSize: 12 }}>{item.description}</Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 기타 알림 */}
          {otherNotifications.length > 0 && (
            <div>
              {(overdueNotifications.length > 0 || deadlineNotifications.length > 0) && (
                <div style={{ padding: '8px 16px', background: '#fafafa' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    기타 알림
                  </Text>
                </div>
              )}
              <List
                dataSource={otherNotifications}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: item.read ? '#fff' : getNotificationColor(item.type),
                      borderLeft: item.read ? 'none' : `3px solid ${item.type === 'completed' ? '#52c41a' : '#1890ff'}`,
                    }}
                    onClick={() => markAsRead(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={36}
                          style={{ background: getNotificationColor(item.type) }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(item.id);
                            }}
                            style={{ opacity: 0.5 }}
                          />
                        </div>
                      }
                      description={
                        <div>
                          <Text style={{ fontSize: 12 }}>{item.description}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {dayjs(item.timestamp).fromNow()}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* 푸터 */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <Button type="link" size="small" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Tooltip title="알림">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              color: '#718096',
            }}
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
};

export default NotificationCenter;
