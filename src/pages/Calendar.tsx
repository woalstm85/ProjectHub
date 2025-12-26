import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Tag, Modal, Space, Typography, Badge, Popover, Avatar, List, Segmented, Empty } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FlagFilled,
  UserOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore, TaskStatus, TaskPriority, type CreateTaskDTO } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import TaskModal from '../components/TaskModal';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(isoWeek);
dayjs.extend(weekday);

const { Title, Text } = Typography;

type ViewMode = 'month' | 'week' | 'day' | 'agenda';
type ColorMode = 'status' | 'priority';

interface CalendarEvent {
  id: string;
  title: string;
  start: Dayjs;
  end: Dayjs;
  type: 'task' | 'project' | 'milestone';
  color: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  priority?: TaskPriority;
  assignee?: string;
  description?: string;
}

const Calendar: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks, updateTask, addTask } = useTaskStore();
  const { members } = useMemberStore();
  const { effectiveTheme, settings } = useSettings();

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');
  const [colorMode, setColorMode] = useState<ColorMode>('status');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Task Creation Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<Dayjs | null>(null);

  // 더보기 모달용 state
  const [dayEventsModal, setDayEventsModal] = useState<{ open: boolean; date: Dayjs | null; events: CalendarEvent[] }>({
    open: false,
    date: null,
    events: [],
  });

  const isDark = effectiveTheme === 'dark';

  const colors = {
    bg: isDark ? '#141414' : '#ffffff',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    headerBg: isDark ? '#262626' : '#fafafa',
    cellBg: isDark ? '#1f1f1f' : '#ffffff',
    cellHoverBg: isDark ? '#2a2a2a' : '#f5f5f5',
    todayBg: isDark ? '#1a3a5c' : '#e6f7ff',
    weekendBg: isDark ? '#1a1a1a' : '#fafafa',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#404040' : '#f0f0f0',
    eventBg: isDark ? '#2a2a2a' : '#ffffff',
  };

  const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: '#8c8c8c',
    [TaskPriority.MEDIUM]: '#1890ff',
    [TaskPriority.HIGH]: '#fa8c16',
    [TaskPriority.URGENT]: '#ff4d4f',
  };

  const statusColors: Record<string, string> = {
    [TaskStatus.TODO]: '#d9d9d9',
    [TaskStatus.IN_PROGRESS]: '#52c41a',
    [TaskStatus.REVIEW]: '#1890ff',
    [TaskStatus.DONE]: '#ff4d4f',
  };

  // 이벤트 데이터 생성
  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    projects.forEach(project => {
      if (filterProject !== 'ALL' && project.id !== filterProject) return;
      if (filterMember !== 'ALL') return; // 프로젝트는 멤버 필터 적용 시 제외 (또는 PM 기준 필터링 가능하지만 일단 제외)

      result.push({
        id: `project-${project.id}`,
        title: project.name,
        start: dayjs(project.startDate),
        end: dayjs(project.endDate),
        type: 'project',
        color: settings.primaryColor,
        projectId: project.id,
        description: project.description,
      });
    });

    tasks.forEach(task => {
      if (filterProject !== 'ALL' && task.projectId !== filterProject) return;
      if (filterMember !== 'ALL' && task.assignee !== filterMember) return;
      if (!task.dueDate) return;

      const project = projects.find(p => p.id === task.projectId);
      const startDate = task.startDate ? dayjs(task.startDate) : dayjs(task.dueDate);

      let eventColor = '#1890ff';
      if (colorMode === 'status') {
        eventColor = statusColors[task.status] || '#1890ff';
      } else {
        eventColor = priorityColors[task.priority] || '#1890ff';
      }

      result.push({
        id: task.id,
        title: task.title,
        start: startDate,
        end: dayjs(task.dueDate),
        type: 'task',
        color: eventColor,
        projectId: task.projectId,
        projectName: project?.name,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        description: task.description,
      });
    });

    return result;
  }, [projects, tasks, filterProject, filterMember, colorMode, settings.primaryColor]);

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(dayjs());
      return;
    }
    const unit = viewMode === 'month' ? 'month' : viewMode === 'week' ? 'week' : 'day';
    setCurrentDate(prev => direction === 'next' ? prev.add(1, unit) : prev.subtract(1, unit));
  };

  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = event.start.startOf('day');
      const eventEnd = event.end.startOf('day');
      const targetDate = date.startOf('day');
      return targetDate.isSame(eventStart) || targetDate.isSame(eventEnd) ||
        (targetDate.isAfter(eventStart) && targetDate.isBefore(eventEnd));
    });
  };

  const handleDragStart = (event: CalendarEvent) => {
    if (event.type === 'task') {
      setDraggedEvent(event);
    }
  };

  const handleDrop = (date: Dayjs) => {
    if (draggedEvent && draggedEvent.type === 'task') {
      const daysDiff = date.diff(draggedEvent.end, 'day');
      const newStartDate = draggedEvent.start.add(daysDiff, 'day');
      const newEndDate = date;

      updateTask(draggedEvent.id, {
        startDate: newStartDate.toDate(),
        dueDate: newEndDate.toDate(),
      });

      setDraggedEvent(null);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleDateClick = (date: Dayjs) => {
    setSelectedDateForTask(date);
    setIsTaskModalOpen(true);
  };

  const handleTaskCreate = (values: any) => {
    addTask({
      ...values,
      startDate: values.startDate ? values.startDate.toDate() : undefined,
      dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
    } as CreateTaskDTO);
    setIsTaskModalOpen(false);
  };

  // 더보기 클릭
  const handleMoreClick = (e: React.MouseEvent, date: Dayjs, events: CalendarEvent[]) => {
    e.stopPropagation();
    setDayEventsModal({ open: true, date, events });
  };

  const renderHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.format('YYYY년 MM월');
    } else if (viewMode === 'week') {
      const weekStart = currentDate.startOf('week');
      const weekEnd = currentDate.endOf('week');
      return `${weekStart.format('YYYY.MM.DD')} - ${weekEnd.format('MM.DD')}`;
    } else if (viewMode === 'agenda') {
      return '일정 목록';
    } else {
      return currentDate.format('YYYY년 MM월 DD일 (ddd)');
    }
  };

  const renderEventPopover = (event: CalendarEvent) => {
    const assignee = event.assignee ? members.find(m => m.id === event.assignee) : null;

    return (
      <div style={{ width: 280, padding: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16, color: colors.text }}>{event.title}</Text>
          {event.type === 'task' && event.projectName && (
            <div>
              <Tag color="blue" style={{ marginTop: 4 }}>{event.projectName}</Tag>
            </div>
          )}
        </div>

        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: colors.textSecondary }} />
            <Text style={{ color: colors.textSecondary }}>
              {event.start.format('MM/DD')} - {event.end.format('MM/DD')}
            </Text>
          </div>

          {event.priority && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlagFilled style={{ color: priorityColors[event.priority] }} />
              <Text style={{ color: colors.textSecondary }}>
                {event.priority === 'URGENT' ? '긴급' : event.priority === 'HIGH' ? '높음' : event.priority === 'MEDIUM' ? '보통' : '낮음'}
              </Text>
            </div>
          )}

          {assignee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} src={assignee.avatar} />
              <Text style={{ color: colors.textSecondary }}>{assignee.name}</Text>
            </div>
          )}

          {event.description && (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{event.description}</Text>
          )}
        </Space>
      </div>
    );
  };

  const renderEvent = (event: CalendarEvent, isCompact: boolean = false) => {
    const content = (
      <div
        draggable={event.type === 'task'}
        onDragStart={() => handleDragStart(event)}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(event);
        }}
        style={{
          padding: isCompact ? '2px 6px' : '4px 8px',
          borderRadius: 4,
          marginBottom: 2,
          cursor: 'pointer',
          backgroundColor: event.type === 'project'
            ? `${event.color}22`
            : isDark ? '#2a2a2a' : '#f5f5f5',
          borderLeft: `3px solid ${event.color}`,
          fontSize: isCompact ? 11 : 12,
          color: colors.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {event.type === 'project' && <FlagFilled style={{ marginRight: 4, fontSize: 10 }} />}
        {event.title}
      </div>
    );

    return (
      <Popover
        key={event.id}
        content={renderEventPopover(event)}
        trigger="hover"
        placement="right"
      >
        {content}
      </Popover>
    );
  };

  // 월간 뷰
  const renderMonthView = () => {
    const monthStart = currentDate.startOf('month');
    const monthEnd = currentDate.endOf('month');
    const startDate = monthStart.startOf('week');
    const endDate = monthEnd.endOf('week');

    const weeks: Dayjs[][] = [];
    let currentWeek: Dayjs[] = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      day = day.add(1, 'day');
    }

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 340px)',
        minHeight: 500,
      }}>
        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: colors.headerBg, flexShrink: 0 }}>
          {weekDays.map((day, index) => (
            <div
              key={day}
              style={{
                padding: '12px 8px',
                textAlign: 'center',
                fontWeight: 600,
                color: index === 0 ? '#ff4d4f' : index === 6 ? '#1890ff' : colors.text,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 - flex: 1로 남은 공간 채우기 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
              {week.map((date, dayIndex) => {
                const isToday = date.isSame(dayjs(), 'day');
                const isCurrentMonth = date.month() === currentDate.month();
                const isSunday = dayIndex === 0;
                const isSaturday = dayIndex === 6;
                const isWeekend = isSunday || isSaturday;
                const dayEvents = getEventsForDate(date);

                return (
                  <div
                    key={date.format('YYYY-MM-DD')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(date)}
                    onClick={() => handleDateClick(date)}
                    style={{
                      padding: 8,
                      borderRight: dayIndex < 6 ? `1px solid ${colors.border}` : 'none',
                      borderBottom: weekIndex < weeks.length - 1 ? `1px solid ${colors.border}` : 'none',
                      background: isToday
                        ? colors.todayBg
                        : isWeekend
                          ? colors.weekendBg
                          : colors.cellBg,
                      opacity: isCurrentMonth ? 1 : 0.4,
                      transition: 'background 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.cellHoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isToday ? colors.todayBg : isWeekend ? colors.weekendBg : colors.cellBg}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                      flexShrink: 0,
                    }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          fontSize: 13,
                          fontWeight: isToday ? 700 : 400,
                          color: isToday ? '#fff' : isSunday ? '#ff4d4f' : isSaturday ? '#1890ff' : colors.text,
                          background: isToday ? settings.primaryColor : 'transparent',
                        }}
                      >
                        {date.date()}
                      </span>
                      {dayEvents.length > 3 && (
                        <Badge count={dayEvents.length} size="small" style={{ backgroundColor: settings.primaryColor }} />
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {dayEvents.slice(0, 3).map(event => renderEvent(event, true))}
                      {dayEvents.length > 3 && (
                        <div
                          onClick={(e) => handleMoreClick(e, date, dayEvents)}
                          style={{
                            fontSize: 11,
                            color: settings.primaryColor,
                            marginTop: 2,
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          +{dayEvents.length - 3}개 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 주간 뷰
  const renderWeekView = () => {
    const weekStart = currentDate.startOf('week');
    const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        height: 'calc(100vh - 340px)',
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', background: colors.headerBg, flexShrink: 0 }}>
          <div style={{ padding: 12, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }} />
          {days.map((date, index) => {
            const isToday = date.isSame(dayjs(), 'day');
            const isSunday = index === 0;
            const isSaturday = index === 6;
            return (
              <div
                key={date.format('YYYY-MM-DD')}
                style={{
                  padding: 12,
                  textAlign: 'center',
                  borderRight: index < 6 ? `1px solid ${colors.border}` : 'none',
                  borderBottom: `1px solid ${colors.border}`,
                  background: isToday ? colors.todayBg : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => handleDateClick(date)}
              >
                <div style={{ fontSize: 12, color: isSunday ? '#ff4d4f' : isSaturday ? '#1890ff' : colors.textSecondary }}>
                  {date.format('ddd')}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? settings.primaryColor : isSunday ? '#ff4d4f' : isSaturday ? '#1890ff' : colors.text,
                  }}
                >
                  {date.date()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 시간대 그리드 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {hours.map(hour => (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: 48 }}>
              <div style={{
                padding: '4px 8px',
                fontSize: 11,
                color: colors.textSecondary,
                borderRight: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                textAlign: 'right',
              }}>
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {days.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isWeekend = index === 0 || index === 6;
                return (
                  <div
                    key={`${date.format('YYYY-MM-DD')}-${hour}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(date)}
                    onClick={() => handleDateClick(date)}
                    style={{
                      borderRight: index < 6 ? `1px solid ${colors.border}` : 'none',
                      borderBottom: `1px solid ${colors.border}`,
                      background: isWeekend ? colors.weekendBg : colors.cellBg,
                      padding: 2,
                      cursor: 'pointer',
                    }}
                  >
                    {hour === 9 && dayEvents.map(event => renderEvent(event, true))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 일간 뷰
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: 16,
        height: 'calc(100vh - 340px)',
        minHeight: 500,
      }}>
        {/* 일정 목록 */}
        <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, overflow: 'auto' }}>
          <Title level={5} style={{ marginBottom: 16, color: colors.text }}>
            {currentDate.format('MM월 DD일')} 일정
          </Title>
          {dayEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: colors.textSecondary }}>
              <CalendarOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div>일정이 없습니다</div>
              <Button type="link" onClick={() => handleDateClick(currentDate)}>
                일정 추가하기
              </Button>
            </div>
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: isDark ? '#2a2a2a' : '#f5f5f5',
                    borderLeft: `4px solid ${event.color}`,
                    cursor: 'pointer',
                  }}
                >
                  <Text strong style={{ color: colors.text }}>{event.title}</Text>
                  <div style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {event.start.format('MM/DD')} - {event.end.format('MM/DD')}
                  </div>
                </div>
              ))}
              <Button block type="dashed" icon={<PlusOutlined />} onClick={() => handleDateClick(currentDate)}>
                일정 추가
              </Button>
            </Space>
          )}
        </Card>

        {/* 시간대 그리드 */}
        <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }} bodyStyle={{ padding: 0, height: '100%', overflow: 'auto' }}>
          {hours.map(hour => (
            <div
              key={hour}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(currentDate)}
              onClick={() => handleDateClick(currentDate)}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                minHeight: 48,
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{
                padding: '4px 8px',
                fontSize: 11,
                color: colors.textSecondary,
                textAlign: 'right',
                borderRight: `1px solid ${colors.border}`,
              }}>
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              <div style={{ padding: 4 }}>
                {hour === 9 && dayEvents.map(event => renderEvent(event))}
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // 안건 뷰 (Agenda View)
  const renderAgendaView = () => {
    // 다가오는 30일간의 일정
    const upcomingEvents = events
      .filter(e => e.end.isAfter(dayjs().subtract(1, 'day')))
      .sort((a, b) => a.start.valueOf() - b.start.valueOf());

    // 날짜별 그룹화
    const groupedEvents: Record<string, CalendarEvent[]> = {};
    upcomingEvents.forEach(event => {
      const dateKey = event.start.format('YYYY-MM-DD');
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <Card
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          height: 'calc(100vh - 340px)',
          minHeight: 500,
          overflow: 'auto'
        }}
      >
        {Object.keys(groupedEvents).length === 0 ? (
          <Empty description="예정된 일정이 없습니다" />
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {Object.entries(groupedEvents).map(([dateStr, dateEvents]) => {
              const date = dayjs(dateStr);
              const isToday = date.isSame(dayjs(), 'day');

              return (
                <div key={dateStr} style={{ marginBottom: 24 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    marginBottom: 12,
                    borderBottom: `1px solid ${colors.border}`,
                    paddingBottom: 8
                  }}>
                    <Text strong style={{ fontSize: 18, color: isToday ? settings.primaryColor : colors.text, marginRight: 8 }}>
                      {date.format('M월 D일')}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {date.format('dddd')}
                    </Text>
                    {isToday && <Tag color={settings.primaryColor} style={{ marginLeft: 12 }}>오늘</Tag>}
                  </div>

                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {dateEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: colors.cellBg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = event.color;
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          width: 4,
                          height: 40,
                          background: event.color,
                          borderRadius: 2,
                          marginRight: 16
                        }} />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text strong style={{ fontSize: 15, color: colors.text }}>{event.title}</Text>
                            {event.type === 'project' && <Tag>프로젝트</Tag>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {event.start.format('HH:mm')} - {event.end.format('HH:mm')}
                            </Text>
                            {event.projectName && (
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                <FlagFilled style={{ marginRight: 4 }} />
                                {event.projectName}
                              </Text>
                            )}
                          </div>
                        </div>

                        {event.assignee && (
                          <Avatar
                            size="small"
                            src={members.find(m => m.id === event.assignee)?.avatar}
                            icon={<UserOutlined />}
                          />
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>캘린더</Title>
          <Text type="secondary">프로젝트와 작업 일정을 한눈에 확인하세요</Text>
        </div>
        <Space wrap>
          <Select
            value={filterProject}
            onChange={setFilterProject}
            style={{ width: 160 }}
            options={[
              { value: 'ALL', label: '전체 프로젝트' },
              ...projects.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          <Select
            value={filterMember}
            onChange={setFilterMember}
            style={{ width: 140 }}
            placeholder="담당자 선택"
            options={[
              { value: 'ALL', label: '모든 담당자' },
              ...members.map(m => ({ value: m.id, label: m.name }))
            ]}
          />
          <Segmented
            value={colorMode}
            onChange={(val) => setColorMode(val as ColorMode)}
            options={[
              { value: 'status', label: '상태별' },
              { value: 'priority', label: '우선순위별' },
            ]}
          />
        </Space>
      </div>

      {/* 컨트롤 바 */}
      <Card
        style={{ marginBottom: 16, background: colors.cardBg, border: `1px solid ${colors.border}` }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Today Button */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <Button onClick={() => navigateDate('today')}>오늘</Button>
          </div>

          {/* Center: Navigation & Title */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <Button icon={<LeftOutlined />} onClick={() => navigateDate('prev')} />
            <Title level={4} style={{ margin: 0, minWidth: 160, textAlign: 'center' }}>{renderHeaderTitle()}</Title>
            <Button icon={<RightOutlined />} onClick={() => navigateDate('next')} />
          </div>

          {/* Right: View Mode Buttons */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as ViewMode)}
              options={[
                { value: 'month', label: '월', icon: <CalendarOutlined /> },
                { value: 'week', label: '주', icon: <AppstoreOutlined /> },
                { value: 'day', label: '일', icon: <ClockCircleOutlined /> },
                { value: 'agenda', label: '목록', icon: <UnorderedListOutlined /> },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 범례 */}
      {viewMode !== 'agenda' && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {colorMode === 'status' ? (
            <>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: settings.primaryColor }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>프로젝트</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#52c41a' }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>진행중</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#1890ff' }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>검토중</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#ff4d4f' }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>완료</Text>
              </Space>
            </>
          ) : (
            <>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: priorityColors[TaskPriority.URGENT] }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>긴급</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: priorityColors[TaskPriority.HIGH] }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>높음</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: priorityColors[TaskPriority.MEDIUM] }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>보통</Text>
              </Space>
              <Space>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: priorityColors[TaskPriority.LOW] }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>낮음</Text>
              </Space>
            </>
          )}
        </div>
      )}

      {/* 캘린더 뷰 */}
      <div style={{ flex: 1 }}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'agenda' && renderAgendaView()}
      </div>

      {/* 더보기 모달 */}
      <Modal
        title={dayEventsModal.date ? `${dayEventsModal.date.format('YYYY년 MM월 DD일')} 일정` : '일정'}
        open={dayEventsModal.open}
        onCancel={() => setDayEventsModal({ open: false, date: null, events: [] })}
        footer={null}
        width={500}
      >
        <List
          dataSource={dayEventsModal.events}
          renderItem={(event) => {
            const assignee = event.assignee ? members.find(m => m.id === event.assignee) : null;
            return (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '12px 0',
                }}
                onClick={() => {
                  setDayEventsModal({ open: false, date: null, events: [] });
                  handleEventClick(event);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div style={{
                    width: 4,
                    height: 40,
                    borderRadius: 2,
                    background: event.color,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: colors.text }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>
                      {event.start.format('MM/DD')} - {event.end.format('MM/DD')}
                      {event.projectName && ` · ${event.projectName}`}
                    </div>
                  </div>
                  {assignee && (
                    <Avatar size="small" icon={<UserOutlined />} src={assignee.avatar} />
                  )}
                  {event.priority && (
                    <FlagFilled style={{ color: priorityColors[event.priority] }} />
                  )}
                </div>
              </List.Item>
            );
          }}
        />
        <Button
          block
          type="dashed"
          icon={<PlusOutlined />}
          style={{ marginTop: 16 }}
          onClick={() => {
            if (dayEventsModal.date) {
              setDayEventsModal({ open: false, date: null, events: [] });
              handleDateClick(dayEventsModal.date);
            }
          }}
        >
          이 날짜에 일정 추가
        </Button>
      </Modal>

      {/* 이벤트 상세 모달 */}
      <Modal
        title={selectedEvent?.title}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={500}
      >
        {selectedEvent && (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: colors.textSecondary }} />
                <Text>
                  {selectedEvent.start.format('YYYY년 MM월 DD일')} - {selectedEvent.end.format('YYYY년 MM월 DD일')}
                </Text>
              </div>

              {selectedEvent.type === 'task' && selectedEvent.projectName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FlagFilled style={{ color: settings.primaryColor }} />
                  <Text>프로젝트: {selectedEvent.projectName}</Text>
                </div>
              )}

              {selectedEvent.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={statusColors[selectedEvent.status]}>
                    {selectedEvent.status === 'TODO' ? '할일' :
                      selectedEvent.status === 'IN_PROGRESS' ? '진행중' :
                        selectedEvent.status === 'REVIEW' ? '검토중' : '완료'}
                  </Tag>
                </div>
              )}

              {selectedEvent.priority && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FlagFilled style={{ color: priorityColors[selectedEvent.priority] }} />
                  <Text>
                    우선순위: {selectedEvent.priority === 'URGENT' ? '긴급' :
                      selectedEvent.priority === 'HIGH' ? '높음' :
                        selectedEvent.priority === 'MEDIUM' ? '보통' : '낮음'}
                  </Text>
                </div>
              )}

              {selectedEvent.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined style={{ color: colors.textSecondary }} />
                  <Text>담당자: {members.find(m => m.id === selectedEvent.assignee)?.name || '-'}</Text>
                </div>
              )}

              {selectedEvent.description && (
                <div style={{ marginTop: 8, padding: 12, background: isDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 8 }}>
                  <Text style={{ color: colors.textSecondary }}>{selectedEvent.description}</Text>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* 작업 생성 모달 */}
      <TaskModal
        open={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        onOk={handleTaskCreate}
        title="새 일정 추가"
        initialValues={{
          startDate: selectedDateForTask,
          dueDate: selectedDateForTask,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        }}
      />
    </div>
  );
};

export default Calendar;
