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
  Avatar,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  DeleteOutlined,
  CheckOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useTaskStore, TaskStatus } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useSettings } from '../store/settingsStore';
import { useMessageStore } from '../store/messageStore';
import { useAuthStore } from '../store/authStore';
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
  const { settings } = useSettings();
  const { messages, markAsRead: markMessageAsRead, deleteMessage: deleteStoreMessage } = useMessageStore();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!settings.notifications.enabled) {
      setNotifications([]);
      return;
    }

    const newNotifications: Notification[] = [];
    const now = dayjs();

    if (settings.notifications.deadlineReminder) {
      tasks.forEach(task => {
        if (task.status === TaskStatus.DONE || !task.dueDate) return;

        const dueDate = dayjs(task.dueDate);
        const daysLeft = dueDate.diff(now, 'day');
        const project = projects.find(p => p.id === task.projectId);

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
        } else if (daysLeft <= settings.notifications.deadlineDays && daysLeft >= 0) {
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

    // 메시지/알림 추가
    if (user) {
      messages
        .filter(m => m.receiverId === user.memberId || m.receiverId === user.id)
        .forEach(m => {
          newNotifications.push({
            id: `msg-${m.id}`,
            type: m.content.includes('프로젝트') ? 'project' : 'assigned',
            title: m.content.includes('프로젝트') ? '프로젝트 알림' : '새 메시지',
            description: m.content,
            timestamp: m.createdAt,
            read: m.isRead,
          });
        });
    }

    newNotifications.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (b.type === 'overdue' && a.type !== 'overdue') return 1;
      if (a.type === 'deadline' && b.type !== 'deadline' && b.type !== 'overdue') return -1;
      if (b.type === 'deadline' && a.type !== 'deadline' && a.type !== 'overdue') return 1;
      return dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf();
    });

    setNotifications(newNotifications);
  }, [tasks, projects, settings.notifications, messages, user]);

  const markAsRead = (id: string) => {
    if (id.startsWith('msg-')) {
      markMessageAsRead(id.replace('msg-', ''));
    } else {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const removeNotification = (id: string) => {
    if (id.startsWith('msg-')) {
      deleteStoreMessage(id.replace('msg-', ''));
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue': return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case 'deadline': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'assigned': return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'project': return <ProjectOutlined style={{ color: '#722ed1' }} />;
      default: return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'overdue': return '#fff1f0';
      case 'deadline': return '#fffbe6';
      case 'completed': return '#f6ffed';
      case 'assigned': return '#e6f7ff';
      case 'project': return '#f9f0ff';
      default: return '#fafafa';
    }
  };

  const overdueNotifications = notifications.filter(n => n.type === 'overdue');
  const deadlineNotifications = notifications.filter(n => n.type === 'deadline');
  const otherNotifications = notifications.filter(n => !['overdue', 'deadline'].includes(n.type));

  const dropdownContent = (
    <div style={{ width: 380, maxHeight: 500, background: '#fff', borderRadius: 12, boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text strong style={{ fontSize: 16 }}>알림</Text>
          {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />}
        </Space>
        <Space size={4}>
          <Tooltip title="모두 읽음"><Button type="text" size="small" icon={<CheckOutlined />} onClick={markAllAsRead} disabled={unreadCount === 0} /></Tooltip>
          <Tooltip title="모두 삭제"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={clearAll} disabled={notifications.length === 0} /></Tooltip>
        </Space>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={settings.notifications.enabled ? "새로운 알림이 없습니다" : "알림이 비활성화되어 있습니다"} />
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {overdueNotifications.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#fff1f0' }}>
                <Text type="danger" strong style={{ fontSize: 12 }}><FireOutlined /> 지연된 작업 ({overdueNotifications.length})</Text>
              </div>
              <List
                dataSource={overdueNotifications}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 16px', cursor: 'pointer', background: item.read ? '#fff' : '#fff1f0', borderLeft: item.read ? 'none' : '3px solid #ff4d4f' }} onClick={() => markAsRead(item.id)}>
                    <List.Item.Meta
                      avatar={<Avatar size={36} style={{ background: getNotificationColor(item.type) }} icon={getNotificationIcon(item.type)} />}
                      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Text strong style={{ fontSize: 13 }}>{item.title}</Text><Button type="text" size="small" icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); removeNotification(item.id); }} style={{ opacity: 0.5 }} /></div>}
                      description={<div><Text style={{ fontSize: 12 }}>{item.description}</Text><div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 11 }}>마감: {dayjs(item.timestamp).format('MM.DD')}</Text></div></div>}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {deadlineNotifications.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', background: '#fffbe6' }}>
                <Text style={{ color: '#d48806', fontSize: 12 }} strong><ClockCircleOutlined /> 마감 임박 ({deadlineNotifications.length})</Text>
              </div>
              <List
                dataSource={deadlineNotifications}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 16px', cursor: 'pointer', background: item.read ? '#fff' : '#fffbe6', borderLeft: item.read ? 'none' : '3px solid #faad14' }} onClick={() => markAsRead(item.id)}>
                    <List.Item.Meta
                      avatar={<Avatar size={36} style={{ background: getNotificationColor(item.type) }} icon={getNotificationIcon(item.type)} />}
                      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Space><Text strong style={{ fontSize: 13 }}>{item.title}</Text><Tag color="warning" style={{ fontSize: 10 }}>{dayjs(item.timestamp).format('MM.DD')}</Tag></Space><Button type="text" size="small" icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); removeNotification(item.id); }} style={{ opacity: 0.5 }} /></div>}
                      description={<Text style={{ fontSize: 12 }}>{item.description}</Text>}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {otherNotifications.length > 0 && (
            <div>
              {(overdueNotifications.length > 0 || deadlineNotifications.length > 0) && (
                <div style={{ padding: '8px 16px', background: '#fafafa' }}><Text type="secondary" style={{ fontSize: 12 }}>기타 알림</Text></div>
              )}
              <List
                dataSource={otherNotifications}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 16px', cursor: 'pointer', background: item.read ? '#fff' : getNotificationColor(item.type), borderLeft: item.read ? 'none' : `3px solid ${item.type === 'completed' ? '#52c41a' : '#1890ff'}` }} onClick={() => markAsRead(item.id)}>
                    <List.Item.Meta
                      avatar={<Avatar size={36} style={{ background: getNotificationColor(item.type) }} icon={getNotificationIcon(item.type)} />}
                      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Text strong style={{ fontSize: 13 }}>{item.title}</Text><Button type="text" size="small" icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); removeNotification(item.id); }} style={{ opacity: 0.5 }} /></div>}
                      description={<div><Text style={{ fontSize: 12 }}>{item.description}</Text><div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.timestamp).fromNow()}</Text></div></div>}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      )}

      {notifications.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Button type="link" size="small" onClick={() => setOpen(false)}>닫기</Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown dropdownRender={() => dropdownContent} trigger={['click']} open={open} onOpenChange={setOpen} placement="bottomRight">
      <Tooltip title="알림">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button type="text" icon={<BellOutlined />} style={{ width: 40, height: 40, borderRadius: 8, color: '#718096' }} />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
};

export default NotificationCenter;
