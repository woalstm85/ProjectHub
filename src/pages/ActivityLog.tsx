import React, { useState, useMemo } from 'react';
import { Typography, Space, Tag, Select, Empty, Button, Segmented, Input, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  UserOutlined,
  FolderAddOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ProjectOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Activity } from '../store/activityStore';
import { useActivityStore, ActivityType, getActivityMessage, getActivityColor } from '../store/activityStore';
import { useProjectStore } from '../store/projectStore';
import { useSettings } from '../store/settingsStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// 활동 타입별 아이콘 컴포넌트
const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
  const iconStyle = { fontSize: 14 };

  switch (type) {
    case ActivityType.TASK_CREATED:
      return <PlusCircleOutlined style={iconStyle} />;
    case ActivityType.TASK_UPDATED:
      return <EditOutlined style={iconStyle} />;
    case ActivityType.TASK_DELETED:
      return <DeleteOutlined style={iconStyle} />;
    case ActivityType.TASK_STATUS_CHANGED:
      return <SwapOutlined style={iconStyle} />;
    case ActivityType.TASK_ASSIGNED:
      return <UserOutlined style={iconStyle} />;
    case ActivityType.PROJECT_CREATED:
      return <FolderAddOutlined style={iconStyle} />;
    case ActivityType.PROJECT_UPDATED:
      return <FolderOutlined style={iconStyle} />;
    case ActivityType.PROJECT_DELETED:
      return <DeleteOutlined style={iconStyle} />;
    case ActivityType.PROJECT_COMPLETED:
      return <CheckCircleOutlined style={iconStyle} />;
    case ActivityType.MEMBER_ADDED:
      return <UserAddOutlined style={iconStyle} />;
    case ActivityType.MEMBER_UPDATED:
      return <UserOutlined style={iconStyle} />;
    case ActivityType.MEMBER_REMOVED:
      return <UserDeleteOutlined style={iconStyle} />;
    default:
      return <InfoCircleOutlined style={iconStyle} />;
  }
};

const ActivityLog: React.FC = () => {
  const { activities, clearActivities } = useActivityStore();
  const { projects } = useProjectStore();
  const { effectiveTheme, settings } = useSettings();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const isDark = effectiveTheme === 'dark';

  const colors = {
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    itemBg: isDark ? '#262626' : '#fafafa',
    itemHoverBg: isDark ? '#303030' : '#f0f0f0',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#8c8c8c' : '#8c8c8c',
    textTertiary: isDark ? '#595959' : '#bfbfbf',
    border: isDark ? '#303030' : '#e0e0e0',
    divider: isDark ? '#303030' : '#f5f5f5',
    shadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
  };

  // 필터링된 활동 목록
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // 1. Type Filter
      if (filterType !== 'ALL') {
        if (filterType === 'TASK' && !activity.type.startsWith('TASK_')) return false;
        if (filterType === 'PROJECT' && !activity.type.startsWith('PROJECT_')) return false;
        if (filterType === 'MEMBER' && !activity.type.startsWith('MEMBER_')) return false;
      }

      // 2. Project Filter
      if (filterProject !== 'ALL' && activity.projectId !== filterProject) return false;

      // 3. Search Filter
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        const matches =
          (activity.userName?.toLowerCase().includes(lowerSearch)) ||
          (activity.projectName?.toLowerCase().includes(lowerSearch)) ||
          (activity.taskName?.toLowerCase().includes(lowerSearch)) ||
          (activity.description?.toLowerCase().includes(lowerSearch)) ||
          (getActivityMessage(activity).toLowerCase().includes(lowerSearch));
        if (!matches) return false;
      }

      // 4. Date Range Filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const activityDate = dayjs(activity.timestamp);
        if (activityDate.isBefore(dateRange[0], 'day') || activityDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [activities, filterType, filterProject, searchText, dateRange]);

  // 날짜별로 그룹화
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};

    filteredActivities.forEach((activity) => {
      const date = dayjs(activity.timestamp).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  // 시간 포맷
  const formatTime = (timestamp: Date): string => {
    return dayjs(timestamp).format('HH:mm');
  };

  // 활동 타입 라벨
  const getTypeLabel = (type: ActivityType): string => {
    if (type.startsWith('TASK_')) return '작업';
    if (type.startsWith('PROJECT_')) return '프로젝트';
    if (type.startsWith('MEMBER_')) return '팀원';
    return '기타';
  };

  // 통계 계산
  const stats = useMemo(() => {
    const today = dayjs().startOf('day');
    const todayActivities = filteredActivities.filter(a =>
      dayjs(a.timestamp).isAfter(today)
    );

    return {
      total: filteredActivities.length,
      today: todayActivities.length,
      created: filteredActivities.filter(a => a.type.includes('CREATED') || a.type.includes('ADDED')).length,
      updated: filteredActivities.filter(a => a.type.includes('UPDATED') || a.type.includes('CHANGED')).length,
      deleted: filteredActivities.filter(a => a.type.includes('DELETED') || a.type.includes('REMOVED')).length,
    };
  }, [filteredActivities]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 4 }}>활동 로그</Title>
            <Text style={{ color: colors.textSecondary }}>
              프로젝트의 모든 변경 사항을 추적합니다
            </Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              새로고침
            </Button>
            <Button danger onClick={clearActivities}>
              초기화
            </Button>
          </Space>
        </div>

        {/* 통계 바 */}
        <div style={{
          display: 'flex',
          gap: 24,
          marginTop: 20,
          padding: '16px 20px',
          background: colors.cardBg,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
        }}>
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>전체</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: colors.text }}>{stats.total}</div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>오늘</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: settings.primaryColor }}>{stats.today}</div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>생성</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.created}</div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>수정</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.updated}</div>
          </div>
          <div style={{ width: 1, background: colors.border }} />
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>삭제</Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{stats.deleted}</div>
          </div>
        </div>
      </div>

      {/* 필터 & 뷰 전환 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
        background: colors.cardBg,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
      }}>
        <Space wrap size="middle">
          <Input
            prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
            placeholder="검색어 입력..."
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />

          <RangePicker
            style={{ width: 240 }}
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
            placeholder={['시작일', '종료일']}
          />

          <div style={{ width: 1, height: 24, background: colors.divider }} />

          <Segmented
            value={filterType}
            onChange={(value) => setFilterType(value as string)}
            options={[
              { value: 'ALL', label: '전체' },
              { value: 'TASK', label: '작업' },
              { value: 'PROJECT', label: '프로젝트' },
              { value: 'MEMBER', label: '팀원' },
            ]}
          />

          <Select
            value={filterProject}
            onChange={setFilterProject}
            style={{ width: 180 }}
            suffixIcon={<ProjectOutlined />}
            options={[
              { value: 'ALL', label: '전체 프로젝트' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </Space>
      </div>

      {/* 활동 목록 (타임라인 뷰) */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        borderRadius: 12,
      }}>
        {filteredActivities.length === 0 ? (
          <div style={{ padding: 60 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: colors.textSecondary }}>
                  {activities.length === 0
                    ? "활동 기록이 없습니다"
                    : "필터 조건에 맞는 활동이 없습니다"
                  }
                </span>
              }
            />
          </div>
        ) : (
          <div style={{ padding: '20px 40px 20px 140px' }}>
            {Object.entries(groupedActivities).map(([date, dateActivities], groupIndex) => (
              <div key={date} style={{ marginBottom: 40, position: 'relative' }}>
                {/* 날짜 라벨 (타임라인 왼쪽) */}
                <div style={{
                  position: 'absolute',
                  left: -160,
                  top: 0,
                  width: 120,
                  textAlign: 'right',
                  paddingTop: 4
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                    {dayjs(date).format('M월 D일')}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {dayjs(date).format('dddd')}
                  </div>
                </div>

                {/* 타임라인 선 */}
                <div style={{
                  position: 'absolute',
                  left: -20,
                  top: 10,
                  bottom: -50,
                  width: 2,
                  background: colors.border,
                  display: groupIndex === Object.keys(groupedActivities).length - 1 ? 'none' : 'block'
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {dateActivities.map((activity,) => {
                    const color = getActivityColor(activity.type);
                    const message = getActivityMessage(activity);

                    return (
                      <div key={activity.id} style={{ position: 'relative' }}>
                        {/* 타임라인 점 */}
                        <div style={{
                          position: 'absolute',
                          left: -25,
                          top: 16,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: color,
                          border: `2px solid ${colors.cardBg}`,
                          boxShadow: `0 0 0 2px ${color}40`,
                          zIndex: 2,
                        }} />

                        {/* 카드 */}
                        <div
                          style={{
                            background: colors.itemBg,
                            borderRadius: 12,
                            padding: 16,
                            border: `1px solid ${colors.border}`,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = color;
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.border;
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            {/* 아이콘 */}
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: `${color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: color,
                              flexShrink: 0,
                              marginTop: 2,
                            }}>
                              <ActivityIcon type={activity.type} />
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Space size={8}>
                                  <Text strong style={{ color: colors.text }}>
                                    {activity.userName || '사용자'}
                                  </Text>
                                  <Tag
                                    style={{
                                      margin: 0,
                                      fontSize: 10,
                                      lineHeight: '18px',
                                      padding: '0 6px',
                                      borderRadius: 4,
                                      border: 'none',
                                      background: `${color}15`,
                                      color: color,
                                    }}
                                  >
                                    {getTypeLabel(activity.type)}
                                  </Tag>
                                </Space>
                                <Text style={{ color: colors.textTertiary, fontSize: 12, fontFamily: 'monospace' }}>
                                  {formatTime(activity.timestamp)}
                                </Text>
                              </div>

                              <Text style={{ color: colors.textSecondary, fontSize: 14, display: 'block', marginBottom: 8 }}>
                                {message}
                              </Text>

                              {activity.projectName && (
                                <Tag
                                  icon={<ProjectOutlined />}
                                  style={{
                                    cursor: 'pointer',
                                    background: isDark ? '#262626' : '#ffffff',
                                    border: `1px solid ${colors.border}`,
                                    color: colors.textSecondary,
                                    transition: 'all 0.2s',
                                  }}
                                  onClick={() => activity.projectId && navigate(`/projects/${activity.projectId}`)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = settings.primaryColor;
                                    e.currentTarget.style.borderColor = settings.primaryColor;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.textSecondary;
                                    e.currentTarget.style.borderColor = colors.border;
                                  }}
                                >
                                  {activity.projectName}
                                </Tag>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
