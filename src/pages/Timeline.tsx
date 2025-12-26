import React, { useState } from 'react';
import { Card, Table, Progress, Tag, Space, Empty, Typography, Button, Tooltip as AntTooltip, Avatar, Divider, Select, Segmented, Input } from 'antd';
import {
  FolderOpenFilled,
  FolderFilled,
  FileTextOutlined,
  CalendarOutlined,
  PlusSquareOutlined,
  MinusSquareOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FlagFilled,
  UserOutlined,
  CloseOutlined,
  AppstoreOutlined,
  SearchOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useProjectStore, ProjectStatus } from '../store/projectStore';
import { useTaskStore, TaskStatus } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

const { Text, Title } = Typography;

interface TimelineItem {
  key: string;
  type: 'project' | 'task' | 'member';
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: ProjectStatus | TaskStatus | 'ACTIVE';
  parentId?: string;
  children?: TimelineItem[];
  childrenCount?: number;
  assignee?: string;
  description?: string;
  avatar?: string;
}

const Timeline: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members } = useMemberStore();
  const { effectiveTheme, settings } = useSettings();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1600);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [viewMode, setViewMode] = useState<'PROJECT' | 'RESOURCE'>('PROJECT');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [memberFilter, setMemberFilter] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const isDark = effectiveTheme === 'dark';

  // 다크모드 색상
  const colors = {
    bg: isDark ? '#141414' : '#ffffff',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    headerBg: isDark ? '#262626' : '#f8fafc',
    text: isDark ? '#ffffff' : '#1e293b',
    textSecondary: isDark ? '#a0a0a0' : '#64748b',
    border: isDark ? '#404040' : '#e2e8f0',
    gridLine: isDark ? '#303030' : '#f1f5f9',
    monthBg: isDark ? '#262626' : '#f1f5f9',
    weekBg: isDark ? '#1f1f1f' : '#f8fafc',
    projectRowBg: isDark ? '#1a2744' : '#f8fafc',
    memberRowBg: isDark ? '#1a3a2e' : '#f6ffed',
    taskRowBg: isDark ? '#1f1f1f' : '#ffffff',
    projectBarBg: isDark ? '#1d4ed8' : '#3b82f6',
    taskBarBg: isDark ? '#525252' : '#94a3b8',
    progressBg: isDark ? '#404040' : '#e2e8f0',
    modalBg: isDark ? '#1f1f1f' : '#ffffff',
    modalOverlay: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
    iconBg: isDark ? '#2a3a50' : '#e6f7ff',
    legendText: isDark ? '#a0a0a0' : '#64748b',
  };

  if (projects.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>타임라인</Title>
        </div>
        <Card bordered={false} style={{ background: colors.cardBg }}>
          <Empty description={<span style={{ color: colors.textSecondary }}>등록된 프로젝트가 없습니다.</span>} />
        </Card>
      </div>
    );
  }

  const allDates = projects.flatMap(p => [p.startDate, p.endDate]);
  const minDate = dayjs(Math.min(...allDates.map(d => new Date(d).getTime()))).startOf('month');
  const maxDate = dayjs(Math.max(...allDates.map(d => new Date(d).getTime()))).endOf('month');
  const totalDays = Math.max(1, maxDate.diff(minDate, 'day'));

  const getDatePosition = (date: Date | dayjs.Dayjs) => {
    const targetDate = dayjs(date);
    const daysPassed = targetDate.diff(minDate, 'day');
    return Math.max(0, Math.min(100, (daysPassed / totalDays) * 100));
  };

  const scrollToToday = () => {
    const todayPos = getDatePosition(dayjs());
    // 테이블의 스크롤 컨테이너를 찾아서 스크롤 (ant-table-body 클래스 사용)
    const tableBody = document.querySelector('.ant-table-body');
    if (tableBody) {
      const scrollWidth = tableBody.scrollWidth;
      const clientWidth = tableBody.clientWidth;
      // 전체 너비 중 오늘 위치 비율만큼 이동, 화면 중앙에 오도록 조정
      const scrollLeft = (scrollWidth * (todayPos / 100)) - (clientWidth / 2);
      tableBody.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const renderHeaderGrid = () => {
    const months: React.ReactNode[] = [];
    const weeks: React.ReactNode[] = [];

    let mCurrent = minDate.clone();
    while (mCurrent.isBefore(maxDate)) {
      const blockStart = mCurrent.isBefore(minDate) ? minDate : mCurrent;
      const nextMonth = mCurrent.add(1, 'month').startOf('month');
      const blockEnd = nextMonth.isAfter(maxDate) ? maxDate : nextMonth;
      const left = getDatePosition(blockStart);
      const width = getDatePosition(blockEnd) - left;

      if (width > 0.1) {
        months.push(
          <div
            key={`m-${mCurrent.format('YYYY-MM')}`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              height: 28,
              backgroundColor: colors.monthBg,
              borderRight: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: colors.text,
            }}
          >
            {mCurrent.format('YY.MM')}
          </div>
        );
      }
      mCurrent = mCurrent.add(1, 'month').startOf('month');
    }

    let wCurrent = minDate.clone();
    while (wCurrent.isBefore(maxDate)) {
      const left = getDatePosition(wCurrent);
      const nextWeek = wCurrent.add(1, 'week');
      const width = getDatePosition(nextWeek) - left;
      weeks.push(
        <div
          key={`w-${wCurrent.valueOf()}`}
          style={{
            position: 'absolute',
            left: `${left}%`,
            width: `${width}%`,
            height: 24,
            backgroundColor: colors.weekBg,
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: colors.textSecondary,
          }}
        >
          {wCurrent.week()}
        </div>
      );
      wCurrent = nextWeek;
    }

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', height: 28 }}>{months}</div>
        <div style={{ position: 'relative', height: 24 }}>{weeks}</div>
        {dayjs().isAfter(minDate) && dayjs().isBefore(maxDate) && (
          <div
            style={{
              position: 'absolute',
              left: `${getDatePosition(dayjs())}%`,
              bottom: 0,
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <div style={{
              backgroundColor: '#ff4d4f',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px 4px 0 0',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {dayjs().format('MM.DD')}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBodyGrid = () => {
    const gridLines: React.ReactNode[] = [];
    let current = minDate.clone();
    while (current.isBefore(maxDate)) {
      gridLines.push(
        <div
          key={`g-${current.valueOf()}`}
          style={{
            position: 'absolute',
            left: `${getDatePosition(current)}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: colors.gridLine,
          }}
        />
      );
      current = current.add(1, 'week');
    }

    const today = dayjs();
    if (today.isAfter(minDate) && today.isBefore(maxDate)) {
      gridLines.push(
        <div
          key="today-marker"
          style={{
            position: 'absolute',
            left: `${getDatePosition(today)}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: '2px dashed #ff4d4f',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      );
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{gridLines}</div>;
  };

  const renderTimelineBar = (item: TimelineItem) => {
    if (item.type === 'member') {
      return (
        <div style={{ position: 'relative', height: 40 }}>
          {renderBodyGrid()}
        </div>
      );
    }

    const startPos = getDatePosition(item.startDate);
    const endPos = getDatePosition(item.endDate);
    const width = Math.max(0.5, endPos - startPos);
    const isProject = item.type === 'project';
    const barHeight = isProject ? 24 : 18;
    const isMilestone = !isProject && dayjs(item.endDate).diff(dayjs(item.startDate), 'day') === 0;
    const isSelected = selectedItem?.key === item.key;

    return (
      <div style={{ position: 'relative', height: 40 }}>
        {renderBodyGrid()}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          {isMilestone ? (
            <AntTooltip title={`Milestone: ${item.name} (${dayjs(item.startDate).format('YYYY-MM-DD')})`}>
              <div
                onClick={() => setSelectedItem(item)}
                style={{
                  position: 'absolute',
                  left: `${startPos}%`,
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: 16,
                  height: 16,
                  backgroundColor: isSelected ? '#1890ff' : '#722ed1',
                  top: 4,
                  zIndex: 5,
                  border: '2px solid #fff',
                  boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FlagFilled style={{ transform: 'rotate(-45deg)', fontSize: 10, color: '#fff', position: 'absolute', top: 1, left: 3 }} />
              </div>
            </AntTooltip>
          ) : (
            <div
              onClick={() => setSelectedItem(item)}
              style={{
                position: 'absolute',
                left: `${startPos}%`,
                width: `${width}%`,
                height: barHeight,
                backgroundColor: isProject ? colors.projectBarBg : colors.taskBarBg,
                borderRadius: isProject ? 6 : 4,
                cursor: 'pointer',
                border: isSelected ? '2px solid #1890ff' : 'none',
                boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
                zIndex: isSelected ? 6 : 4,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${item.progress}%`,
                  backgroundColor: isProject ? '#60a5fa' : '#a1a1aa',
                  opacity: 0.6,
                }}
              />
              {width > 3 && (
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  marginLeft: 8,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}>
                  {item.progress}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getExpandedData = () => {
    const result: TimelineItem[] = [];

    if (viewMode === 'PROJECT') {
      projects.forEach(project => {
        // 검색 필터 적용
        if (searchText && !project.name.toLowerCase().includes(searchText.toLowerCase())) {
          // 프로젝트 이름이 검색어와 일치하지 않으면, 하위 태스크 중 일치하는 것이 있는지 확인해야 함
          // 하지만 간단한 구현을 위해 일단 프로젝트 이름 매칭만 확인하거나, 
          // 아래에서 태스크 필터링 후 태스크가 있으면 프로젝트도 표시하는 방식으로 개선 가능
        }

        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const filteredTasks = projectTasks.filter(task => {
          const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
          const matchMember = memberFilter === 'ALL' || task.assignee === memberFilter;
          const matchSearch = !searchText || task.title.toLowerCase().includes(searchText.toLowerCase()) || project.name.toLowerCase().includes(searchText.toLowerCase());
          return matchStatus && matchMember && matchSearch;
        });

        // 프로젝트 자체 검색 매칭 여부
        const projectMatch = !searchText || project.name.toLowerCase().includes(searchText.toLowerCase());

        if ((statusFilter !== 'ALL' || memberFilter !== 'ALL' || searchText) && filteredTasks.length === 0 && !projectMatch) {
          return;
        }

        const projectRow: TimelineItem = {
          key: project.id,
          type: 'project',
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.endDate,
          progress: project.progress,
          status: project.status,
          childrenCount: filteredTasks.length,
          description: project.description
        };

        result.push(projectRow);

        if (expandedKeys.includes(project.id)) {
          filteredTasks.forEach(task => {
            // 시작일이 없으면 마감일을 사용 (마감일도 없으면 프로젝트 날짜 사용)
            const taskEndDate = task.dueDate || project.endDate;
            const taskStartDate = task.startDate || taskEndDate;

            result.push({
              key: task.id,
              type: 'task',
              id: task.id,
              name: task.title,
              startDate: taskStartDate,
              endDate: taskEndDate,
              progress: task.status === TaskStatus.DONE ? 100 : task.status === TaskStatus.IN_PROGRESS ? 50 : 0,
              status: task.status,
              parentId: project.id,
              assignee: task.assignee,
              description: task.description
            });
          });
        }
      });
    } else {
      const allMembers = [...members];
      const unassignedTasks = tasks.filter(t => !t.assignee);

      allMembers.forEach(member => {
        const memberTasks = tasks.filter(t => t.assignee === member.id);
        const filteredTasks = memberTasks.filter(task => {
          const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
          const matchMember = memberFilter === 'ALL' || task.assignee === memberFilter;
          const matchSearch = !searchText || task.title.toLowerCase().includes(searchText.toLowerCase());
          return matchStatus && matchMember && matchSearch;
        });

        const memberMatch = !searchText || member.name.toLowerCase().includes(searchText.toLowerCase());

        if (filteredTasks.length === 0 && memberFilter !== 'ALL' && memberFilter !== member.id) {
          return;
        }

        if (filteredTasks.length === 0 && statusFilter !== 'ALL') return;
        if (filteredTasks.length === 0 && searchText && !memberMatch) return;

        const memberRow: TimelineItem = {
          key: member.id,
          type: 'member',
          id: member.id,
          name: member.name,
          startDate: minDate.toDate(),
          endDate: maxDate.toDate(),
          progress: 0,
          status: 'ACTIVE',
          childrenCount: filteredTasks.length,
          avatar: member.avatar
        };

        result.push(memberRow);

        if (expandedKeys.includes(member.id)) {
          filteredTasks.forEach(task => {
            const project = projects.find(p => p.id === task.projectId);
            // 시작일이 없으면 마감일을 사용
            const taskEndDate = task.dueDate || project?.endDate || new Date();
            const taskStartDate = task.startDate || taskEndDate;

            result.push({
              key: task.id,
              type: 'task',
              id: task.id,
              name: task.title,
              startDate: taskStartDate,
              endDate: taskEndDate,
              progress: task.status === TaskStatus.DONE ? 100 : task.status === TaskStatus.IN_PROGRESS ? 50 : 0,
              status: task.status,
              parentId: member.id,
              assignee: task.assignee,
              description: task.description
            });
          });
        }
      });

      const unassignedFiltered = unassignedTasks.filter(task => {
        const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
        const matchMember = memberFilter === 'ALL';
        const matchSearch = !searchText || task.title.toLowerCase().includes(searchText.toLowerCase());
        return matchStatus && matchMember && matchSearch;
      });

      if (unassignedFiltered.length > 0) {
        const unassignedId = 'unassigned';
        const unassignedRow: TimelineItem = {
          key: unassignedId,
          type: 'member',
          id: unassignedId,
          name: '미지정 (Unassigned)',
          startDate: minDate.toDate(),
          endDate: maxDate.toDate(),
          progress: 0,
          status: 'ACTIVE',
          childrenCount: unassignedFiltered.length,
        };
        result.push(unassignedRow);

        if (expandedKeys.includes(unassignedId)) {
          unassignedFiltered.forEach(task => {
            const project = projects.find(p => p.id === task.projectId);
            // 시작일이 없으면 마감일을 사용
            const taskEndDate = task.dueDate || project?.endDate || new Date();
            const taskStartDate = task.startDate || taskEndDate;

            result.push({
              key: task.id,
              type: 'task',
              id: task.id,
              name: task.title,
              startDate: taskStartDate,
              endDate: taskEndDate,
              progress: task.status === TaskStatus.DONE ? 100 : task.status === TaskStatus.IN_PROGRESS ? 50 : 0,
              status: task.status,
              parentId: unassignedId,
              assignee: undefined,
              description: task.description
            });
          });
        }
      }
    }

    return result;
  };

  const renderStatusTag = (status: string) => {
    let color = 'default';
    let text = status;

    if (status === 'IN_PROGRESS') { color = 'processing'; text = '진행중'; }
    else if (status === 'COMPLETED' || status === 'DONE') { color = 'success'; text = '완료'; }
    else if (status === 'PLANNING' || status === 'TODO') { color = 'default'; text = '대기'; }
    else if (status === 'ON_HOLD') { color = 'warning'; text = '보류'; }
    else if (status === 'CANCELLED') { color = 'error'; text = '취소'; }
    else if (status === 'ACTIVE') { return null; }

    return (
      <Tag
        color={color}
        style={{ margin: 0, borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 10 }}
      >
        {text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 340,
      fixed: 'left' as const,
      render: (text: string, record: TimelineItem) => {
        const isParent = record.type === 'project' || record.type === 'member';
        const hasChildren = isParent && (record.childrenCount || 0) > 0;
        const isExpanded = expandedKeys.includes(record.key);

        const toggleExpand = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isParent && hasChildren) {
            setExpandedKeys(prev =>
              isExpanded ? prev.filter(k => k !== record.key) : [...prev, record.key]
            );
          }
        };

        return (
          <div
            onClick={toggleExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: isParent ? 0 : 40,
              cursor: (isParent && hasChildren) ? 'pointer' : 'default',
            }}
          >
            {/* 확장 아이콘 */}
            <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isParent && hasChildren ? (
                isExpanded ?
                  <MinusSquareOutlined style={{ fontSize: 14, color: colors.textSecondary }} /> :
                  <PlusSquareOutlined style={{ fontSize: 14, color: colors.textSecondary }} />
              ) : null}
            </div>

            {/* 타입 아이콘 */}
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {record.type === 'project' ? (
                isExpanded ?
                  <FolderOpenFilled style={{ fontSize: 18, color: '#3b82f6' }} /> :
                  <FolderFilled style={{ fontSize: 18, color: isDark ? '#6b7280' : '#94a3b8' }} />
              ) : record.type === 'member' ? (
                <Avatar size={24} icon={<UserOutlined />} src={record.avatar} style={{ backgroundColor: '#87d068' }} />
              ) : (
                <FileTextOutlined style={{ fontSize: 16, color: isDark ? '#6b7280' : '#cbd5e1' }} />
              )}
            </div>

            {/* 텍스트 영역 */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Text
                strong={isParent}
                style={{
                  color: isParent ? colors.text : colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 1.4,
                  display: 'block',
                }}
                ellipsis={{ tooltip: text }}
              >
                {text}
              </Text>
              {record.type === 'project' && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 1.3 }}>
                  {dayjs(record.startDate).format('YY.MM.DD')} - {dayjs(record.endDate).format('MM.DD')}
                </Text>
              )}
              {record.type === 'member' && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, lineHeight: 1.3 }}>
                  {record.childrenCount} Tasks
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center' as const,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: 'Duration',
      key: 'period',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: TimelineItem) => {
        if (record.type === 'member') return null;

        // 작업의 경우: 실제 startDate가 있으면 사용, 없으면 마감일만 표시
        if (record.type === 'task') {
          // startDate가 endDate와 같거나 없는 경우 (마감일만 있는 경우)
          const start = dayjs(record.startDate);
          const end = dayjs(record.endDate);
          const isSameDay = start.isSame(end, 'day');

          if (isSameDay) {
            return (
              <Space size={4} style={{ color: colors.textSecondary, fontSize: 11 }}>
                <CalendarOutlined />
                <span>{end.format('MM.DD')}</span>
              </Space>
            );
          }
        }

        // 프로젝트 또는 시작일이 있는 작업
        const days = dayjs(record.endDate).diff(dayjs(record.startDate), 'day') + 1;
        return (
          <Space size={4} style={{ color: colors.textSecondary, fontSize: 11 }}>
            <CalendarOutlined />
            <span>{days} Days</span>
          </Space>
        );
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 100,
      render: (progress: number, record: TimelineItem) => {
        if (record.type === 'member') return null;
        return (
          <Progress
            percent={progress}
            size="small"
            strokeColor={{ '0%': settings.primaryColor, '100%': '#2563eb' }}
            trailColor={colors.progressBg}
          />
        );
      },
    },
    {
      title: renderHeaderGrid(),
      key: 'timeline',
      width: zoomLevel,
      render: (_: unknown, record: TimelineItem) => renderTimelineBar(record),
    },
  ];

  const getAssigneeDetails = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return members.find(m => m.id === assigneeId);
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Row 1: Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>타임라인</Title>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: colors.legendText }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: colors.projectBarBg, borderRadius: 2 }}></div> Project
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: colors.taskBarBg, borderRadius: 2 }}></div> Task
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, backgroundColor: '#722ed1', transform: 'rotate(45deg)' }}></div> Milestone
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 2, height: 12, backgroundColor: '#ff4d4f' }}></div> Today
            </div>
          </div>
        </div>

        {/* Row 2: Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: colors.cardBg, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}` }}>
          <Space size={12} align="center" wrap>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Divider type="vertical" style={{ borderColor: colors.border }} />

            <Segmented
              options={[
                { label: 'Project', value: 'PROJECT', icon: <AppstoreOutlined /> },
                { label: 'Resource', value: 'RESOURCE', icon: <UserOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => {
                setViewMode(val as 'PROJECT' | 'RESOURCE');
                setExpandedKeys([]);
              }}
            />

            <Select
              defaultValue="ALL"
              style={{ width: 120 }}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'DONE', label: 'Done' },
              ]}
            />
            <Select
              defaultValue="ALL"
              style={{ width: 140 }}
              onChange={setMemberFilter}
              options={[
                { value: 'ALL', label: 'All Members' },
                ...members.map(m => ({ value: m.id, label: m.name }))
              ]}
            />
          </Space>

          <Space wrap>
            <Button icon={<AimOutlined />} onClick={scrollToToday}>Today</Button>
            <Divider type="vertical" style={{ borderColor: colors.border }} />
            <Space.Compact>
              <Button icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(800, prev - 200))} />
              <Button icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(3000, prev + 200))} />
            </Space.Compact>
          </Space>
        </div>
      </div>

      {/* 테이블 */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{
          flex: 1,
          boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
          borderRadius: 8,
          background: colors.cardBg,
          border: isDark ? `1px solid ${colors.border}` : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Table
          columns={columns}
          dataSource={getExpandedData()}
          pagination={false}
          rowKey="key"
          rowClassName={(record) => {
            if (record.type === 'project') return 'timeline-project-row';
            if (record.type === 'member') return 'timeline-member-row';
            return 'timeline-task-row';
          }}
          scroll={{ x: zoomLevel + 660, y: 'calc(100vh - 280px)' }}
          onRow={(record) => ({
            onClick: () => setSelectedItem(record as TimelineItem),
            style: {
              background: record.type === 'project'
                ? colors.projectRowBg
                : record.type === 'member'
                  ? colors.memberRowBg
                  : colors.taskRowBg,
              cursor: 'pointer',
            }
          })}
        />
      </Card>

      {/* 상세 모달 */}
      {selectedItem && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.modalOverlay,
              zIndex: 999,
            }}
            onClick={() => setSelectedItem(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 500,
              backgroundColor: colors.modalBg,
              borderRadius: 12,
              padding: 24,
              zIndex: 1000,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, color: colors.text }}>
                {selectedItem.name}
              </Title>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setSelectedItem(null)}
                style={{ color: colors.textSecondary }}
              />
            </div>

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={selectedItem.type === 'project' ? 'blue' : 'default'}>
                  {selectedItem.type.toUpperCase()}
                </Tag>
                {selectedItem.status !== 'ACTIVE' && renderStatusTag(selectedItem.status)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.textSecondary }}>
                <CalendarOutlined />
                <Text style={{ color: colors.text }}>
                  {dayjs(selectedItem.startDate).format('YYYY.MM.DD')} - {dayjs(selectedItem.endDate).format('YYYY.MM.DD')}
                </Text>
              </div>

              {selectedItem.type === 'task' && selectedItem.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.textSecondary }}>
                  <UserOutlined />
                  <Space>
                    <Avatar size="small" src={getAssigneeDetails(selectedItem.assignee)?.avatar} icon={<UserOutlined />} />
                    <Text style={{ color: colors.text }}>
                      {getAssigneeDetails(selectedItem.assignee)?.name}
                    </Text>
                  </Space>
                </div>
              )}

              {selectedItem.description && (
                <div style={{ marginTop: 8, padding: 12, backgroundColor: colors.bg, borderRadius: 8 }}>
                  <Text style={{ color: colors.textSecondary }}>{selectedItem.description}</Text>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Progress</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{selectedItem.progress}%</Text>
                </div>
                <Progress percent={selectedItem.progress} showInfo={false} strokeColor={settings.primaryColor} />
              </div>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default Timeline;
