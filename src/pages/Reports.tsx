import React, { useState, useRef, useMemo } from 'react';
import {
  Card,
  Tabs,
  Button,
  Table,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Typography,
  message,
  Spin,
  DatePicker,
  Select,
  Progress,
  Badge,
  Alert,
  Empty,
} from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  ProjectOutlined,
  FilterOutlined,
  BarChartOutlined,
  HistoryOutlined,
  RiseOutlined,
  DashboardOutlined,
  BugOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FireOutlined,
  CalendarOutlined,
  FallOutlined,
  TrophyOutlined,
  AlertOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

import { useProjectStore, ProjectStatus } from '../store/projectStore';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useIssueStore, IssueStatus, IssuePriority, IssueType, getIssueTypeLabel, getIssueStatusLabel, getIssuePriorityLabel } from '../store/issueStore';
import { useActivityStore } from '../store/activityStore';
import { useSettings } from '../store/settingsStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Cell, PieChart, Pie, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
// 커스텀 Excel 아이콘
const ExcelIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="#2E7D32" />
    <path d="M6 20V4h7v5h5v11H6z" fill="#C8E6C9" />
    <text x="6.5" y="17" fontSize="5" fontWeight="bold" fill="#1B5E20">XLS</text>
  </svg>
);
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ko';

dayjs.extend(isoWeek);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.locale('ko');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 차트 색상 팔레트
const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  purple: '#722ed1',
  cyan: '#13c2c2',
  magenta: '#eb2f96',
  orange: '#fa8c16',
  lime: '#a0d911',
  gold: '#fadb14',
};

const STATUS_COLORS: Record<string, string> = {
  [TaskStatus.TODO]: '#d9d9d9',
  [TaskStatus.IN_PROGRESS]: '#1890ff',
  [TaskStatus.REVIEW]: '#faad14',
  [TaskStatus.DONE]: '#52c41a',
};

const PRIORITY_COLORS: Record<string, string> = {
  [TaskPriority.LOW]: '#8c8c8c',
  [TaskPriority.MEDIUM]: '#1890ff',
  [TaskPriority.HIGH]: '#fa8c16',
  [TaskPriority.URGENT]: '#ff4d4f',
};

const Reports: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members } = useMemberStore();
  const { issues } = useIssueStore();
  const { activities } = useActivityStore();
  const { effectiveTheme } = useSettings();

  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  // --- Filtering State ---
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(3, 'month'),
    dayjs()
  ]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);
  const isDark = effectiveTheme === 'dark';
  const colors = {
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#404040' : '#e8e8e8',
    chartGrid: isDark ? '#404040' : '#e0e0e0',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#1890ff',
  };


  // ==========================================
  // Sub-Components
  // ==========================================

  // KPI Card Component
  const KPICard = ({ title, value, suffix, color, icon, detail, progress }: any) => (
    <Card bordered={false} style={{ background: colors.cardBg, borderColor: colors.border, borderRadius: 12, height: '100%' }}>
      <Statistic
        title={<Text type="secondary">{icon} {title}</Text>}
        value={value}
        suffix={suffix}
        valueStyle={{ color, fontWeight: 'bold', fontSize: 28 }}
      />
      {progress !== undefined && (
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={color}
          size="small"
          style={{ marginTop: 4 }}
        />
      )}
      {detail && <div style={{ fontSize: 12, marginTop: 8 }}>{detail}</div>}
    </Card>
  );

  // Filter Bar Component (Memoized to prevent flickering)
  const FilterBar = React.memo(({ dateRange, setDateRange, selectedProjectIds, setSelectedProjectIds, selectedMemberIds, setSelectedMemberIds, projectOptions, memberOptions }: any) => {
    return (
      <Card size="small" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, marginBottom: 24 }}>
        <Space wrap size="middle">
          <Space>
            <FilterOutlined style={{ color: colors.textSecondary }} />
            <Text strong>필터:</Text>
          </Space>
          <RangePicker
            value={dateRange}
            onChange={(val) => setDateRange(val ? [val[0], val[1]] : [null, null])}
            style={{ width: 280 }}
            placeholder={['시작일', '종료일']}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="프로젝트 선택"
            style={{ width: 250 }} // FIXED WIDTH to prevent flickering
            value={selectedProjectIds}
            onChange={setSelectedProjectIds}
            maxTagCount="responsive"
            allowClear
            options={projectOptions}
            popupMatchSelectWidth={false}
          />
          <Select
            mode="multiple"
            placeholder="팀원 선택"
            style={{ width: 200 }} // FIXED WIDTH to prevent flickering
            value={selectedMemberIds}
            onChange={setSelectedMemberIds}
            maxTagCount="responsive"
            allowClear
            options={memberOptions}
            popupMatchSelectWidth={false}
          />
        </Space>
      </Card>
    );
  });

  // ==========================================
  // 데이터 필터링 및 계산
  // ==========================================

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      (selectedProjectIds.length === 0 || selectedProjectIds.includes(p.id))
    );
  }, [projects, selectedProjectIds]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchProject = selectedProjectIds.length === 0 || selectedProjectIds.includes(t.projectId);
      const matchMember = selectedMemberIds.length === 0 || (t.assignee && selectedMemberIds.includes(t.assignee));
      const matchDate = !dateRange[0] || !dateRange[1] || !t.createdAt ||
        (dayjs(t.createdAt).isAfter(dateRange[0]) && dayjs(t.createdAt).isBefore(dateRange[1]));
      return matchProject && matchMember && matchDate;
    });
  }, [tasks, selectedProjectIds, selectedMemberIds, dateRange]);

  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      const matchProject = selectedProjectIds.length === 0 || selectedProjectIds.includes(i.projectId);
      const matchDate = !dateRange[0] || !dateRange[1] ||
        (dayjs(i.createdAt).isAfter(dateRange[0]) && dayjs(i.createdAt).isBefore(dateRange[1]));
      return matchProject && matchDate;
    });
  }, [issues, selectedProjectIds, dateRange]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchProject = selectedProjectIds.length === 0 ||
        (a.projectId && selectedProjectIds.includes(a.projectId));
      const matchDate = !dateRange[0] || !dateRange[1] ||
        (dayjs(a.timestamp).isAfter(dateRange[0]) && dayjs(a.timestamp).isBefore(dateRange[1]));
      return matchProject && matchDate;
    });
  }, [activities, selectedProjectIds, dateRange]);

  // ==========================================
  // 핵심 지표 계산
  // ==========================================

  // 프로젝트 건전성 점수 계산
  const getProjectHealthScore = (project: typeof projects[0]) => {
    const pTasks = tasks.filter(t => t.projectId === project.id);
    const pIssues = issues.filter(i => i.projectId === project.id);

    let score = 100;

    // 예산 초과 감점
    if (project.budget > 0) {
      const budgetRatio = project.spentBudget / project.budget;
      if (budgetRatio > 1) score -= 25;
      else if (budgetRatio > 0.9) score -= 10;
    }

    // 지연 작업 감점
    const overdueTasks = pTasks.filter(t =>
      t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE
    );
    if (pTasks.length > 0) {
      const overdueRatio = overdueTasks.length / pTasks.length;
      score -= overdueRatio * 30;
    }

    // 미해결 긴급 이슈 감점
    const criticalIssues = pIssues.filter(i =>
      i.priority === IssuePriority.CRITICAL &&
      i.status !== IssueStatus.RESOLVED &&
      i.status !== IssueStatus.CLOSED
    );
    score -= criticalIssues.length * 5;

    // 프로젝트 상태 감점
    if (project.status === ProjectStatus.ON_HOLD) score -= 15;
    if (project.status === ProjectStatus.CANCELLED) score -= 40;

    return Math.max(0, Math.round(score));
  };

  // 마감일 준수율 계산
  const calculateDeadlineCompliance = () => {
    const completedTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE && t.dueDate);
    if (completedTasks.length === 0) return { rate: 0, onTime: 0, late: 0 };

    const onTime = completedTasks.filter(t =>
      dayjs(t.updatedAt).isSameOrBefore(dayjs(t.dueDate), 'day')
    ).length;

    return {
      rate: Math.round((onTime / completedTasks.length) * 100),
      onTime,
      late: completedTasks.length - onTime
    };
  };

  // 평균 작업 완료 시간 계산
  const calculateAvgCompletionTime = () => {
    const completedTasks = filteredTasks.filter(t =>
      t.status === TaskStatus.DONE && t.startDate && t.updatedAt
    );
    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((acc, t) => {
      return acc + dayjs(t.updatedAt).diff(dayjs(t.startDate), 'day');
    }, 0);

    return Math.round(totalDays / completedTasks.length);
  };

  // 이슈 평균 해결 시간 계산
  const calculateAvgIssueResolutionTime = () => {
    const resolvedIssues = filteredIssues.filter(i =>
      (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED) && i.resolvedAt
    );
    if (resolvedIssues.length === 0) return 0;

    const totalDays = resolvedIssues.reduce((acc, i) => {
      return acc + dayjs(i.resolvedAt).diff(dayjs(i.createdAt), 'day');
    }, 0);

    return Math.round(totalDays / resolvedIssues.length);
  };

  // 위험 프로젝트 목록
  const riskProjects = useMemo(() => {
    return filteredProjects.filter(p => {
      const health = getProjectHealthScore(p);
      const overBudget = p.budget > 0 && p.spentBudget > p.budget * 0.9;
      const hasOverdue = tasks.some(t =>
        t.projectId === p.id &&
        t.dueDate &&
        dayjs(t.dueDate).isBefore(dayjs()) &&
        t.status !== TaskStatus.DONE
      );
      return health < 60 || overBudget || hasOverdue;
    }).map(p => {
      const healthScore = getProjectHealthScore(p);
      const isBudgetRisk = p.budget > 0 && p.spentBudget > p.budget * 0.9;
      const isScheduleRisk = tasks.some(t => t.projectId === p.id && t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE);
      const isIssueRisk = issues.filter(i => i.projectId === p.id && i.priority === IssuePriority.CRITICAL && i.status !== IssueStatus.CLOSED).length > 0;

      return {
        ...p,
        healthScore,
        risks: [
          isBudgetRisk ? { type: 'budget', label: '예산초과위험', icon: <DollarOutlined /> } : null,
          isScheduleRisk ? { type: 'schedule', label: '일정지연', icon: <ClockCircleOutlined /> } : null,
          isIssueRisk ? { type: 'issue', label: '긴급이슈', icon: <FireOutlined /> } : null,
        ].filter(Boolean) as any[]
      };
    });
  }, [filteredProjects, tasks, issues]);

  // 일별 활동 추이 데이터
  const dailyActivityData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) =>
      dayjs().subtract(13 - i, 'day').format('MM-DD')
    );

    return last14Days.map(date => {
      const dayActivities = activities.filter(a =>
        dayjs(a.timestamp).format('MM-DD') === date
      );
      return {
        date,
        total: dayActivities.length,
        tasks: dayActivities.filter(a => a.type.includes('TASK')).length,
        projects: dayActivities.filter(a => a.type.includes('PROJECT')).length,
        members: dayActivities.filter(a => a.type.includes('MEMBER')).length,
      };
    });
  }, [activities]);

  // 작업 상태별 분포
  const taskStatusDistribution = useMemo(() => {
    return [
      { name: '할일', value: filteredTasks.filter(t => t.status === TaskStatus.TODO).length, color: STATUS_COLORS[TaskStatus.TODO] },
      { name: '진행중', value: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: STATUS_COLORS[TaskStatus.IN_PROGRESS] },
      { name: '검토중', value: filteredTasks.filter(t => t.status === TaskStatus.REVIEW).length, color: STATUS_COLORS[TaskStatus.REVIEW] },
      { name: '완료', value: filteredTasks.filter(t => t.status === TaskStatus.DONE).length, color: STATUS_COLORS[TaskStatus.DONE] },
    ];
  }, [filteredTasks]);

  // 이슈 유형별 분포
  const issueTypeDistribution = useMemo(() => {
    return Object.values(IssueType).map(type => ({
      name: getIssueTypeLabel(type),
      value: filteredIssues.filter(i => i.type === type).length,
    }));
  }, [filteredIssues]);

  // 이슈 상태별 분포
  const issueStatusDistribution = useMemo(() => {
    return Object.values(IssueStatus).map(status => ({
      name: getIssueStatusLabel(status),
      value: filteredIssues.filter(i => i.status === status).length,
    }));
  }, [filteredIssues]);

  // 이슈 우선순위별 분포
  const issuePriorityDistribution = useMemo(() => {
    return Object.values(IssuePriority).map(priority => ({
      name: getIssuePriorityLabel(priority),
      value: filteredIssues.filter(i => i.priority === priority).length,
      color: PRIORITY_COLORS[priority] || '#8c8c8c',
    }));
  }, [filteredIssues]);

  // 팀원별 성과 데이터
  const memberPerformanceData = useMemo(() => {
    return members.map(m => {
      const mTasks = tasks.filter(t => t.assignee === m.id);
      const completed = mTasks.filter(t => t.status === TaskStatus.DONE).length;
      const overdue = mTasks.filter(t =>
        t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE
      ).length;
      const mIssues = issues.filter(i => i.assigneeId === m.id);
      const resolvedIssues = mIssues.filter(i =>
        i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED
      ).length;

      return {
        key: m.id,
        name: m.name,
        role: m.role,
        totalTasks: mTasks.length,
        completedTasks: completed,
        activeTasks: mTasks.length - completed,
        overdueTasks: overdue,
        completionRate: mTasks.length > 0 ? Math.round((completed / mTasks.length) * 100) : 0,
        issuesAssigned: mIssues.length,
        issuesResolved: resolvedIssues,
        productivity: Math.min(100, Math.round((completed / Math.max(1, mTasks.length)) * 100 + (resolvedIssues * 5))),
      };
    });
  }, [members, tasks, issues]);

  // 팀원 역량 레이더 차트 데이터
  const memberRadarData = useMemo(() => {
    const topMembers = memberPerformanceData
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 5);

    return topMembers.map(m => ({
      name: m.name,
      완료율: m.completionRate,
      생산성: m.productivity,
      이슈해결: m.issuesAssigned > 0 ? Math.round((m.issuesResolved / m.issuesAssigned) * 100) : 0,
      적시완료: m.totalTasks > 0 ? Math.round(((m.totalTasks - m.overdueTasks) / m.totalTasks) * 100) : 100,
    }));
  }, [memberPerformanceData]);

  // 프로젝트별 데이터 (테이블용)
  const projectTableData = useMemo(() => {
    return filteredProjects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const completed = pTasks.filter(t => t.status === TaskStatus.DONE).length;
      const overdue = pTasks.filter(t =>
        t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE
      ).length;

      return {
        key: p.id,
        name: p.name,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        taskProgress: pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0,
        totalTasks: pTasks.length,
        completedTasks: completed,
        overdueTasks: overdue,
        budget: p.budget,
        spent: p.spentBudget,
        budgetUsage: p.budget > 0 ? Math.round((p.spentBudget / p.budget) * 100) : 0,
        startDate: p.startDate,
        endDate: p.endDate,
        healthScore: getProjectHealthScore(p),
        daysLeft: dayjs(p.endDate).diff(dayjs(), 'day'),
      };
    });
  }, [filteredProjects, tasks]);

  // 예산 현황 데이터
  const budgetData = useMemo(() => {
    return filteredProjects.map(p => ({
      name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
      fullName: p.name,
      budget: p.budget,
      spent: p.spentBudget,
      remaining: Math.max(0, p.budget - p.spentBudget),
      overBudget: Math.max(0, p.spentBudget - p.budget),
      usageRate: p.budget > 0 ? Math.round((p.spentBudget / p.budget) * 100) : 0,
    }));
  }, [filteredProjects]);

  // 월별 추이 데이터 (최근 6개월)
  const monthlyTrendData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) =>
      dayjs().subtract(5 - i, 'month')
    );

    return last6Months.map(month => {
      const monthStart = month.startOf('month');
      const monthEnd = month.endOf('month');

      const monthTasks = tasks.filter(t =>
        t.createdAt && dayjs(t.createdAt).isAfter(monthStart) && dayjs(t.createdAt).isBefore(monthEnd)
      );
      const completedTasks = tasks.filter(t =>
        t.status === TaskStatus.DONE &&
        t.updatedAt &&
        dayjs(t.updatedAt).isAfter(monthStart) &&
        dayjs(t.updatedAt).isBefore(monthEnd)
      );
      const monthIssues = issues.filter(i =>
        dayjs(i.createdAt).isAfter(monthStart) && dayjs(i.createdAt).isBefore(monthEnd)
      );
      const resolvedIssues = issues.filter(i =>
        i.resolvedAt && dayjs(i.resolvedAt).isAfter(monthStart) && dayjs(i.resolvedAt).isBefore(monthEnd)
      );

      return {
        month: month.format('YY.MM'),
        생성된작업: monthTasks.length,
        완료된작업: completedTasks.length,
        발생이슈: monthIssues.length,
        해결이슈: resolvedIssues.length,
      };
    });
  }, [tasks, issues]);

  // 주간 비교 (이번주 vs 지난주)
  const weeklyComparison = useMemo(() => {
    const thisWeekStart = dayjs().startOf('isoWeek');
    const lastWeekStart = thisWeekStart.subtract(1, 'week');
    const lastWeekEnd = thisWeekStart.subtract(1, 'day');

    const thisWeekTasks = tasks.filter(t =>
      t.status === TaskStatus.DONE &&
      t.updatedAt &&
      dayjs(t.updatedAt).isAfter(thisWeekStart)
    ).length;

    const lastWeekTasks = tasks.filter(t =>
      t.status === TaskStatus.DONE &&
      t.updatedAt &&
      dayjs(t.updatedAt).isAfter(lastWeekStart) &&
      dayjs(t.updatedAt).isBefore(lastWeekEnd)
    ).length;

    const thisWeekIssues = issues.filter(i =>
      (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED) &&
      i.resolvedAt &&
      dayjs(i.resolvedAt).isAfter(thisWeekStart)
    ).length;

    const lastWeekIssues = issues.filter(i =>
      (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED) &&
      i.resolvedAt &&
      dayjs(i.resolvedAt).isAfter(lastWeekStart) &&
      dayjs(i.resolvedAt).isBefore(lastWeekEnd)
    ).length;

    return {
      thisWeekTasks,
      lastWeekTasks,
      taskChange: lastWeekTasks > 0 ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100) : 0,
      thisWeekIssues,
      lastWeekIssues,
      issueChange: lastWeekIssues > 0 ? Math.round(((thisWeekIssues - lastWeekIssues) / lastWeekIssues) * 100) : 0,
    };
  }, [tasks, issues]);

  // ==========================================
  // Export 함수
  // ==========================================

  const exportPDF = async () => {
    if (!contentRef.current) {
      message.error('내보낼 콘텐츠를 찾을 수 없습니다.');
      return;
    }

    setIsExporting(true);
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = contentRef.current;

      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = isDark ? '#141414' : '#ffffff';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? '#141414' : '#ffffff',
      });

      element.style.backgroundColor = originalBg;

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 10;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - yPosition - 10;
        const heightToDraw = Math.min(remainingHeight, availableHeight);
        const sourceHeight = (heightToDraw / imgHeight) * canvas.height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          const partImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(partImgData, 'PNG', 10, yPosition, imgWidth, heightToDraw);
        }

        remainingHeight -= heightToDraw;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 10;
        }
      }

      pdf.save(`report_${activeTab}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
      message.success({ content: 'PDF가 다운로드되었습니다!', key: 'pdf-export' });
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      message.error({ content: 'PDF 생성 실패', key: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 프로젝트 시트
    const projectSheet = XLSX.utils.json_to_sheet(projectTableData.map(p => ({
      프로젝트명: p.name,
      상태: p.status,
      우선순위: p.priority,
      진행률: `${p.progress}%`,
      작업완료율: `${p.taskProgress}%`,
      총작업: p.totalTasks,
      완료: p.completedTasks,
      지연: p.overdueTasks,
      예산: p.budget,
      지출: p.spent,
      건전성점수: p.healthScore,
    })));
    XLSX.utils.book_append_sheet(wb, projectSheet, '프로젝트');

    // 팀원 시트
    const memberSheet = XLSX.utils.json_to_sheet(memberPerformanceData.map(m => ({
      이름: m.name,
      역할: m.role,
      총작업: m.totalTasks,
      완료: m.completedTasks,
      진행중: m.activeTasks,
      지연: m.overdueTasks,
      완료율: `${m.completionRate}%`,
      할당이슈: m.issuesAssigned,
      해결이슈: m.issuesResolved,
      생산성: m.productivity,
    })));
    XLSX.utils.book_append_sheet(wb, memberSheet, '팀원성과');

    // 이슈 시트
    const issueSheet = XLSX.utils.json_to_sheet(filteredIssues.map(i => ({
      제목: i.title,
      유형: getIssueTypeLabel(i.type),
      상태: getIssueStatusLabel(i.status),
      우선순위: getIssuePriorityLabel(i.priority),
      생성일: dayjs(i.createdAt).format('YYYY-MM-DD'),
      담당자: i.assigneeName || '미지정',
    })));
    XLSX.utils.book_append_sheet(wb, issueSheet, '이슈목록');

    XLSX.writeFile(wb, `project_report_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('Excel 다운로드가 시작되었습니다.');
  };

  // ==========================================
  // 탭 컨텐츠 렌더링
  // ==========================================

  // 1. 종합 대시보드
  const renderOverviewContent = () => {
    const deadlineCompliance = calculateDeadlineCompliance();
    const avgCompletionTime = calculateAvgCompletionTime();
    const avgIssueResTime = calculateAvgIssueResolutionTime();
    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + p.spentBudget, 0);
    const avgHealth = Math.round(filteredProjects.reduce((acc, p) => acc + getProjectHealthScore(p), 0) / Math.max(1, filteredProjects.length));

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 핵심 KPI 카드 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="평균 건전성 지수"
              value={avgHealth}
              suffix="점"
              color={avgHealth >= 80 ? colors.success : avgHealth >= 60 ? colors.info : colors.danger}
              icon={<TrophyOutlined />}
              progress={avgHealth}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="마감일 준수율"
              value={deadlineCompliance.rate}
              suffix="%"
              color={deadlineCompliance.rate >= 90 ? colors.success : colors.info}
              icon={<ClockCircleOutlined />}
              detail={
                <Text type="secondary">
                  정시 완료 <Text strong style={{ color: colors.success }}>{deadlineCompliance.onTime}</Text>건 /
                  지연 <Text strong style={{ color: colors.danger }}>{deadlineCompliance.late}</Text>건
                </Text>
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="예산 사용률"
              value={totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}
              suffix="%"
              color={(totalSpent / totalBudget) > 0.9 ? colors.danger : colors.success}
              icon={<DollarOutlined />}
              detail={
                <Text type="secondary">
                  지출: {(totalSpent / 10000).toFixed(0)}만원 / 전체: {(totalBudget / 10000).toFixed(0)}만원
                </Text>
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="위험 프로젝트"
              value={riskProjects.length}
              suffix="건"
              color={riskProjects.length > 0 ? colors.danger : colors.success}
              icon={<AlertOutlined />}
              detail={<Text type="secondary">전체 {filteredProjects.length}개 중</Text>}
            />
          </Col>
        </Row>

        {/* 주간 비교 */}
        <Card title={<Space><RiseOutlined /> 주간 성과 비교 (이번 주 vs 지난 주)</Space>} style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            완료 속도: 평균 <Text strong>{avgCompletionTime}</Text>일 / 이슈 해결: 평균 <Text strong>{avgIssueResTime}</Text>일
          </Text>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Statistic
                  title="완료된 작업"
                  value={weeklyComparison.thisWeekTasks}
                  suffix={
                    <span style={{ fontSize: 14, marginLeft: 8, color: weeklyComparison.taskChange >= 0 ? colors.success : colors.danger }}>
                      {weeklyComparison.taskChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                      {Math.abs(weeklyComparison.taskChange)}%
                    </span>
                  }
                  valueStyle={{ fontSize: 32 }}
                />
                <Text type="secondary">지난 주: {weeklyComparison.lastWeekTasks}건</Text>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Statistic
                  title="해결된 이슈"
                  value={weeklyComparison.thisWeekIssues}
                  suffix={
                    <span style={{ fontSize: 14, marginLeft: 8, color: weeklyComparison.issueChange >= 0 ? colors.success : colors.danger }}>
                      {weeklyComparison.issueChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                      {Math.abs(weeklyComparison.issueChange)}%
                    </span>
                  }
                  valueStyle={{ fontSize: 32 }}
                />
                <Text type="secondary">지난 주: {weeklyComparison.lastWeekIssues}건</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 월별 추이 + 위험 프로젝트 */}
        <Row gutter={16}>
          <Col span={16}>
            <Card title={<Space><BarChartOutlined /> 월별 추이 (최근 6개월)</Space>} style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis dataKey="month" tick={{ fill: colors.text }} />
                  <YAxis tick={{ fill: colors.text }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }} />
                  <Legend />
                  <Bar dataKey="생성된작업" fill={CHART_COLORS.primary} opacity={0.7} />
                  <Bar dataKey="완료된작업" fill={CHART_COLORS.success} />
                  <Line type="monotone" dataKey="발생이슈" stroke={CHART_COLORS.warning} strokeWidth={2} />
                  <Line type="monotone" dataKey="해결이슈" stroke={CHART_COLORS.cyan} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              title={<Space><WarningOutlined style={{ color: colors.danger }} /> 위험 프로젝트</Space>}
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, height: '100%' }}
              bodyStyle={{ maxHeight: 300, overflow: 'auto' }}
            >
              {riskProjects.length === 0 ? (
                <Empty description="위험 프로젝트가 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {riskProjects.slice(0, 5).map(p => (
                    <div key={p.id} style={{ padding: 12, background: isDark ? '#2a1f1f' : '#fff2f0', borderRadius: 8, border: `1px solid ${colors.danger}30` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ color: colors.text }}>{p.name}</Text>
                        <Tag color={p.healthScore < 50 ? 'error' : 'warning'}>{p.healthScore}점</Tag>
                      </div>
                      <Space size={4} wrap>
                        {p.risks.map((risk, i) => (
                          <Tag key={i} icon={risk.icon} color={risk.type === 'budget' ? 'warning' : risk.type === 'schedule' ? 'error' : 'magenta'} style={{ fontSize: 11, borderRadius: 4 }}>
                            {risk.label}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    );
  };

  // 2. 프로젝트 상세
  const renderProjectContent = () => {
    const projectColumns = [
      {
        title: '프로젝트명',
        dataIndex: 'name',
        key: 'name',
        render: (text: string) => <Text strong>{text}</Text>
      },
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        render: (status: ProjectStatus) => (
          <Tag color={status === ProjectStatus.COMPLETED ? 'green' : status === ProjectStatus.IN_PROGRESS ? 'blue' : status === ProjectStatus.ON_HOLD ? 'orange' : 'default'}>
            {status}
          </Tag>
        )
      },
      {
        title: '진행률',
        dataIndex: 'progress',
        key: 'progress',
        render: (val: number) => <Progress percent={val} size="small" style={{ width: 100 }} />
      },
      {
        title: '작업',
        key: 'tasks',
        render: (_: any, record: any) => (
          <Space size={4}>
            <Badge count={record.completedTasks} style={{ backgroundColor: colors.success }} />
            <Text type="secondary">/</Text>
            <Badge count={record.totalTasks} style={{ backgroundColor: colors.info }} />
            {record.overdueTasks > 0 && <Badge count={record.overdueTasks} style={{ backgroundColor: colors.danger }} />}
          </Space>
        )
      },
      {
        title: '예산 사용률',
        dataIndex: 'budgetUsage',
        key: 'budgetUsage',
        render: (val: number) => (
          <Tag color={val > 100 ? 'red' : val > 90 ? 'orange' : 'green'}>{val}%</Tag>
        )
      },
      {
        title: '남은 기간',
        dataIndex: 'daysLeft',
        key: 'daysLeft',
        render: (val: number) => (
          <Tag color={val < 0 ? 'red' : val < 7 ? 'orange' : 'default'}>
            {val < 0 ? `${Math.abs(val)}일 초과` : `${val}일`}
          </Tag>
        )
      },
      {
        title: '건전성',
        dataIndex: 'healthScore',
        key: 'healthScore',
        render: (val: number) => {
          const color = val >= 80 ? 'green' : val >= 50 ? 'orange' : 'red';
          return <Tag color={color}>{val}점</Tag>;
        },
        sorter: (a: any, b: any) => a.healthScore - b.healthScore,
      },
    ];

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">총 프로젝트</Text>}
                value={filteredProjects.length}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">진행중</Text>}
                value={filteredProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length}
                valueStyle={{ color: colors.info }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">완료</Text>}
                value={filteredProjects.filter(p => p.status === ProjectStatus.COMPLETED).length}
                valueStyle={{ color: colors.success }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">평균 진행률</Text>}
                value={Math.round(filteredProjects.reduce((acc, p) => acc + p.progress, 0) / Math.max(1, filteredProjects.length))}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="프로젝트별 진행률" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTableData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: colors.text }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: colors.text, fontSize: 11 }} width={80} />
                  <RechartsTooltip />
                  <Bar dataKey="progress" name="진행률" fill={CHART_COLORS.primary}>
                    {projectTableData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progress >= 80 ? CHART_COLORS.success : entry.progress >= 50 ? CHART_COLORS.primary : CHART_COLORS.warning} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="작업 상태 분포" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {taskStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card title="프로젝트 상세 현황" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Table
            columns={projectColumns}
            dataSource={projectTableData}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      </Space>
    );
  };

  // 3. 팀원 성과
  const renderTeamContent = () => {
    const memberColumns = [
      { title: '이름', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
      { title: '역할', dataIndex: 'role', key: 'role', render: (role: string) => <Tag>{role}</Tag> },
      {
        title: '작업 현황',
        key: 'tasks',
        render: (_: any, record: any) => (
          <Space direction="vertical" size={0}>
            <Text>완료: {record.completedTasks} / 전체: {record.totalTasks}</Text>
            <Progress percent={record.completionRate} size="small" style={{ width: 100 }} />
          </Space>
        )
      },
      {
        title: '지연',
        dataIndex: 'overdueTasks',
        key: 'overdueTasks',
        render: (val: number) => val > 0 ? <Tag color="error">{val}건</Tag> : <Tag color="success">0</Tag>
      },
      {
        title: '이슈',
        key: 'issues',
        render: (_: any, record: any) => (
          <Text>{record.issuesResolved} / {record.issuesAssigned} 해결</Text>
        )
      },
      {
        title: '생산성',
        dataIndex: 'productivity',
        key: 'productivity',
        render: (val: number) => (
          <Tag color={val >= 80 ? 'green' : val >= 50 ? 'blue' : 'orange'}>{val}점</Tag>
        ),
        sorter: (a: any, b: any) => a.productivity - b.productivity,
      },
    ];

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic title={<Text type="secondary">총 팀원</Text>} value={members.length} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">평균 완료율</Text>}
                value={Math.round(memberPerformanceData.reduce((acc, m) => acc + m.completionRate, 0) / Math.max(1, members.length))}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">평균 생산성</Text>}
                value={Math.round(memberPerformanceData.reduce((acc, m) => acc + m.productivity, 0) / Math.max(1, members.length))}
                suffix="점"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">지연 작업 보유자</Text>}
                value={memberPerformanceData.filter(m => m.overdueTasks > 0).length}
                suffix="명"
                valueStyle={{ color: memberPerformanceData.filter(m => m.overdueTasks > 0).length > 0 ? colors.warning : colors.success }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="팀원별 작업량" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis dataKey="name" tick={{ fill: colors.text, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.text }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="completedTasks" name="완료" stackId="a" fill={CHART_COLORS.success} />
                  <Bar dataKey="activeTasks" name="진행중" stackId="a" fill={CHART_COLORS.primary} />
                  <Bar dataKey="overdueTasks" name="지연" stackId="a" fill={CHART_COLORS.danger} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="상위 5명 역량 비교" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              {memberRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={memberRadarData}>
                    <PolarGrid stroke={colors.chartGrid} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: colors.text, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: colors.textSecondary }} />
                    <Radar name="완료율" dataKey="완료율" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.3} />
                    <Radar name="생산성" dataKey="생산성" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.3} />
                    <RechartsTooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="데이터가 없습니다" />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="팀원 성과 상세" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Table columns={memberColumns} dataSource={memberPerformanceData} pagination={{ pageSize: 10 }} size="middle" />
        </Card>
      </Space>
    );
  };

  // 4. 이슈 분석
  const renderIssueContent = () => {
    const avgResTime = calculateAvgIssueResolutionTime();
    const openIssues = filteredIssues.filter(i => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED).length;
    const criticalIssues = filteredIssues.filter(i => i.priority === IssuePriority.CRITICAL && i.status !== IssueStatus.CLOSED).length;

    const issueColumns = [
      { title: '제목', dataIndex: 'title', key: 'title', ellipsis: true, render: (text: string) => <Text strong>{text}</Text> },
      { title: '유형', dataIndex: 'type', key: 'type', render: (type: IssueType) => <Tag>{getIssueTypeLabel(type)}</Tag> },
      { title: '상태', dataIndex: 'status', key: 'status', render: (status: IssueStatus) => <Tag color={status === IssueStatus.RESOLVED ? 'green' : status === IssueStatus.IN_PROGRESS ? 'blue' : 'default'}>{getIssueStatusLabel(status)}</Tag> },
      { title: '우선순위', dataIndex: 'priority', key: 'priority', render: (p: IssuePriority) => <Tag color={p === IssuePriority.CRITICAL ? 'red' : p === IssuePriority.HIGH ? 'orange' : 'default'}>{getIssuePriorityLabel(p)}</Tag> },
      { title: '담당자', dataIndex: 'assigneeName', key: 'assigneeName', render: (name: string) => name || <Text type="secondary">미지정</Text> },
      { title: '생성일', dataIndex: 'createdAt', key: 'createdAt', render: (date: Date) => dayjs(date).format('YY.MM.DD') },
    ];

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic title={<Text type="secondary">총 이슈</Text>} value={filteredIssues.length} prefix={<BugOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">미해결 이슈</Text>}
                value={openIssues}
                valueStyle={{ color: openIssues > 0 ? colors.warning : colors.success }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">긴급 이슈</Text>}
                value={criticalIssues}
                valueStyle={{ color: criticalIssues > 0 ? colors.danger : colors.success }}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">평균 해결 시간</Text>}
                value={avgResTime}
                suffix="일"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card title="이슈 유형별 분포" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={issueTypeDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {issueTypeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="이슈 상태별 분포" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={issueStatusDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {issueStatusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={[CHART_COLORS.primary, CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.purple, CHART_COLORS.danger][index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="이슈 우선순위 분포" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={issuePriorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis dataKey="name" tick={{ fill: colors.text }} />
                  <YAxis tick={{ fill: colors.text }} />
                  <RechartsTooltip />
                  <Bar dataKey="value" name="이슈 수">
                    {issuePriorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card title="이슈 목록" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Table
            columns={issueColumns}
            dataSource={filteredIssues.map(i => ({ ...i, key: i.id }))}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      </Space>
    );
  };

  // 5. 일정/시간 분석
  const renderScheduleContent = () => {
    const deadlineCompliance = calculateDeadlineCompliance();
    const avgCompletionTime = calculateAvgCompletionTime();
    const overdueTasks = filteredTasks.filter(t =>
      t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE
    );
    const upcomingDeadlines = filteredTasks
      .filter(t => t.dueDate && dayjs(t.dueDate).isAfter(dayjs()) && dayjs(t.dueDate).isBefore(dayjs().add(7, 'day')) && t.status !== TaskStatus.DONE)
      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">마감일 준수율</Text>}
                value={deadlineCompliance.rate}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: colors.success }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">평균 완료 기간</Text>}
                value={avgCompletionTime}
                suffix="일"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">지연 작업</Text>}
                value={overdueTasks.length}
                suffix="건"
                valueStyle={{ color: overdueTasks.length > 0 ? colors.danger : colors.success }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">7일 내 마감</Text>}
                value={upcomingDeadlines.length}
                suffix="건"
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={<Space><WarningOutlined style={{ color: colors.danger }} /> 지연 작업 목록</Space>}
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              bodyStyle={{ maxHeight: 300, overflow: 'auto' }}
            >
              {overdueTasks.length === 0 ? (
                <Empty description="지연된 작업이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  dataSource={overdueTasks.map(t => ({ ...t, key: t.id }))}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '작업명', dataIndex: 'title', key: 'title', ellipsis: true },
                    {
                      title: '마감일',
                      dataIndex: 'dueDate',
                      key: 'dueDate',
                      render: (date: Date) => <Tag color="error">{dayjs(date).format('MM.DD')}</Tag>
                    },
                    {
                      title: '지연일수',
                      key: 'delay',
                      render: (_: any, record: any) => (
                        <Text type="danger">{dayjs().diff(dayjs(record.dueDate), 'day')}일</Text>
                      )
                    },
                  ]}
                />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={<Space><CalendarOutlined /> 7일 내 마감 예정</Space>}
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              bodyStyle={{ maxHeight: 300, overflow: 'auto' }}
            >
              {upcomingDeadlines.length === 0 ? (
                <Empty description="7일 내 마감 작업이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  dataSource={upcomingDeadlines.map(t => ({ ...t, key: t.id }))}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '작업명', dataIndex: 'title', key: 'title', ellipsis: true },
                    {
                      title: '마감일',
                      dataIndex: 'dueDate',
                      key: 'dueDate',
                      render: (date: Date) => <Tag color="warning">{dayjs(date).format('MM.DD')}</Tag>
                    },
                    {
                      title: 'D-Day',
                      key: 'dday',
                      render: (_: any, record: any) => {
                        const days = dayjs(record.dueDate).diff(dayjs(), 'day');
                        return <Text strong>D-{days}</Text>;
                      }
                    },
                  ]}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    );
  };

  // 6. 활동 로그 분석
  const renderActivityContent = () => {
    const activityByType = [
      { name: '작업 관련', value: filteredActivities.filter(a => a.type.includes('TASK')).length },
      { name: '프로젝트 관련', value: filteredActivities.filter(a => a.type.includes('PROJECT')).length },
      { name: '팀원 관련', value: filteredActivities.filter(a => a.type.includes('MEMBER')).length },
    ];

    const memberActivityData = members.map(m => ({
      name: m.name,
      activities: filteredActivities.filter(a => a.userId === m.id).length,
    })).sort((a, b) => b.activities - a.activities);

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">총 활동</Text>}
                value={filteredActivities.length}
                prefix={<HistoryOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">오늘 활동</Text>}
                value={activities.filter(a => dayjs(a.timestamp).isSame(dayjs(), 'day')).length}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">이번 주 활동</Text>}
                value={activities.filter(a => dayjs(a.timestamp).isAfter(dayjs().startOf('isoWeek'))).length}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">일 평균 활동</Text>}
                value={Math.round(filteredActivities.length / 14)}
                suffix="건"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card title="일별 활동 추이 (최근 14일)" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis dataKey="date" tick={{ fill: colors.text }} />
                  <YAxis tick={{ fill: colors.text }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="tasks" name="작업" stackId="1" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="projects" name="프로젝트" stackId="1" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="members" name="팀원" stackId="1" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="활동 유형별 분포" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityByType.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill={CHART_COLORS.primary} />
                    <Cell fill={CHART_COLORS.success} />
                    <Cell fill={CHART_COLORS.purple} />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card title="팀원별 활동량" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={memberActivityData.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis type="number" tick={{ fill: colors.text }} />
              <YAxis dataKey="name" type="category" tick={{ fill: colors.text }} width={80} />
              <RechartsTooltip />
              <Bar dataKey="activities" name="활동 수" fill={CHART_COLORS.cyan} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Space>
    );
  };

  // 7. 비용 분석
  const renderFinancialContent = () => {
    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budget, 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + p.spentBudget, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetProjects = filteredProjects.filter(p => p.budget > 0 && p.spentBudget > p.budget);

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">총 예산</Text>}
                value={totalBudget}
                prefix="₩"
                formatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">총 지출</Text>}
                value={totalSpent}
                prefix="₩"
                formatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
                valueStyle={{ color: colors.danger }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">잔액</Text>}
                value={totalRemaining}
                prefix="₩"
                formatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
                valueStyle={{ color: totalRemaining >= 0 ? colors.success : colors.danger }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Statistic
                title={<Text type="secondary">예산 초과 프로젝트</Text>}
                value={overBudgetProjects.length}
                suffix="건"
                valueStyle={{ color: overBudgetProjects.length > 0 ? colors.danger : colors.success }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="프로젝트별 예산 현황" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={budgetData} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="name" tick={{ fill: colors.text, fontSize: 11 }} />
              <YAxis tick={{ fill: colors.text }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <RechartsTooltip
                formatter={(value: any) => `${(value || 0).toLocaleString()}원`}
                contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
              />
              <Legend />
              <Bar dataKey="budget" name="예산" fill={CHART_COLORS.primary} opacity={0.3} />
              <Bar dataKey="spent" name="지출" fill={CHART_COLORS.danger} />
              <Bar dataKey="remaining" name="잔액" fill={CHART_COLORS.success} />
              <Line type="monotone" dataKey="usageRate" name="사용률(%)" stroke={CHART_COLORS.warning} strokeWidth={2} yAxisId={1} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {overBudgetProjects.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="예산 초과 프로젝트 경고"
            description={
              <div>
                {overBudgetProjects.map(p => (
                  <div key={p.id}>
                    <Text strong>{p.name}</Text>: 예산 {p.budget.toLocaleString()}원 / 지출 {p.spentBudget.toLocaleString()}원
                    <Tag color="error" style={{ marginLeft: 8 }}>
                      {Math.round(((p.spentBudget - p.budget) / p.budget) * 100)}% 초과
                    </Tag>
                  </div>
                ))}
              </div>
            }
          />
        )}
      </Space>
    );
  };

  // Select options 메모이제이션 (깜박임 방지)
  const projectOptions = useMemo(() =>
    projects.map(p => ({ label: p.name, value: p.id })),
    [projects]
  );

  const memberOptions = useMemo(() =>
    members.map(m => ({ label: m.name, value: m.id })),
    [members]
  );

  // 탭 아이템 메모이제이션
  const tabItems = useMemo(() => [
    { key: 'overview', label: <span><DashboardOutlined /> 종합 대시보드</span> },
    { key: 'project', label: <span><ProjectOutlined /> 프로젝트 분석</span> },
    { key: 'team', label: <span><TeamOutlined /> 팀원 성과</span> },
    { key: 'issue', label: <span><BugOutlined /> 이슈 분석</span> },
    { key: 'schedule', label: <span><CalendarOutlined /> 일정 분석</span> },
    { key: 'activity', label: <span><HistoryOutlined /> 활동 로그</span> },
    { key: 'financial', label: <span><DollarOutlined /> 비용 분석</span> },
  ], []);

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewContent();
      case 'project': return renderProjectContent();
      case 'team': return renderTeamContent();
      case 'issue': return renderIssueContent();
      case 'schedule': return renderScheduleContent();
      case 'activity': return renderActivityContent();
      case 'financial': return renderFinancialContent();
      default: return renderOverviewContent();
    }
  };

  return (
    <div className="reports-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Spin spinning={isExporting} tip="PDF 생성 중...">
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>📊 보고서 & 분석</Title>
              <Text type="secondary">프로젝트, 팀, 이슈, 비용에 대한 종합 분석 리포트</Text>
            </div>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={exportPDF} loading={isExporting}>
                PDF 내보내기
              </Button>
              <Button
                icon={<ExcelIcon />}
                onClick={exportExcel}
                style={{ backgroundColor: '#217346', borderColor: '#217346', color: '#fff' }}
              >
                Excel 내보내기
              </Button>
            </Space>
          </div>

          {/* 필터 바 */}
          <FilterBar
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedProjectIds={selectedProjectIds}
            setSelectedProjectIds={setSelectedProjectIds}
            selectedMemberIds={selectedMemberIds}
            setSelectedMemberIds={setSelectedMemberIds}
            projectOptions={projectOptions}
            memberOptions={memberOptions}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <Card style={{ flex: 1, background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div ref={contentRef}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              type="card"
              size="large"
            />
            <div style={{ marginTop: 16 }}>
              {renderTabContent()}
            </div>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default Reports;
