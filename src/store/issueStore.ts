import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { IndustryType } from './projectStore';
export { IndustryType };

// 이슈 타입
export const IssueType = {
  BUG: 'BUG',
  FEATURE: 'FEATURE',
  IMPROVEMENT: 'IMPROVEMENT',
  QUESTION: 'QUESTION',
  TASK: 'TASK',
  // 제조업용 추가 타입
  DEFECT: 'DEFECT',       // 결함 (제조)
  EQUIPMENT: 'EQUIPMENT', // 설비 (제조)
  SAFETY: 'SAFETY',     // 안전 (제조)
  QUALITY: 'QUALITY',   // 품질 (제조)
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

// 이슈 상태
export const IssueStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

// 이슈 우선순위
export const IssuePriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type IssuePriority = (typeof IssuePriority)[keyof typeof IssuePriority];

// 이슈 심각도 (버그/결함용)
export const IssueSeverity = {
  BLOCKER: 'BLOCKER',
  MAJOR: 'MAJOR',
  MINOR: 'MINOR',
  TRIVIAL: 'TRIVIAL',
} as const;
export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity];

// 이슈 댓글
export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 이슈 첨부파일
export interface IssueAttachment {
  id: string;
  issueId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// 이슈 라벨
export interface IssueLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  industry?: IndustryType;
  category?: string;
}

// 이슈
export interface Issue {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  severity?: IssueSeverity;
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  dueDate?: Date;
  parentIssueId?: string;
  relatedIssueIds?: string[];
  // 소프트웨어용 필드
  environment?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  // 범용 메타데이터 (제조업 등에서 사용: 라인 ID, 설비 번호, 로트 번호 등)
  metadata?: Record<string, string>;
}

export type CreateIssueDTO = Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>;

interface IssueStore {
  issues: Issue[];
  comments: IssueComment[];
  attachments: IssueAttachment[];
  labels: IssueLabel[];
  addIssue: (issue: CreateIssueDTO) => string;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  changeStatus: (id: string, status: IssueStatus) => void;
  assignIssue: (id: string, assigneeId: string, assigneeName: string) => void;
  bulkUpdateIssues: (ids: string[], updates: Partial<Issue>) => void;
  bulkDeleteIssues: (ids: string[]) => void;
  addComment: (comment: Omit<IssueComment, 'id' | 'createdAt'>) => void;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  addAttachment: (attachment: Omit<IssueAttachment, 'id' | 'uploadedAt'>) => void;
  deleteAttachment: (id: string) => void;
  addLabel: (label: Omit<IssueLabel, 'id'>) => void;
  updateLabel: (id: string, updates: Partial<IssueLabel>) => void;
  deleteLabel: (id: string) => void;
  initializeLabels: () => void;
  resetLabelsToDefault: () => void;
  getIssuesByProject: (projectId: string) => Issue[];
  getIssuesByAssignee: (assigneeId: string) => Issue[];
  getIssueComments: (issueId: string) => IssueComment[];
  getIssueAttachments: (issueId: string) => IssueAttachment[];
}

// 산업군별 맞춤 라벨
const defaultLabels: IssueLabel[] = [
  // IT/Software
  { id: 'it-1', name: 'Microservice', color: '#1890ff', description: 'MSA 관련 이슈', industry: IndustryType.SOFTWARE, category: '아키텍처' },
  { id: 'it-2', name: 'Design System', color: '#eb2f96', description: '디자인 시스템 일관성', industry: IndustryType.SOFTWARE, category: '기술/디자인' },
  { id: 'it-3', name: 'State Management', color: '#722ed1', description: '상태 관리(Zustand, Redux) 이슈', industry: IndustryType.SOFTWARE, category: '개발인프라' },
  { id: 'it-4', name: 'CI/CD Pipeline', color: '#fa8c16', description: '배포 파이프라인 장애', industry: IndustryType.SOFTWARE, category: 'DevOps' },
  { id: 'it-5', name: 'Vulnerability', color: '#f5222d', description: '보안 취약점 감지', industry: IndustryType.SOFTWARE, category: '보안/규제' },
  { id: 'it-6', name: 'Memory Leak', color: '#fa541c', description: '메모리 누수 감지', industry: IndustryType.SOFTWARE, category: '품질/안정성' },
  { id: 'it-7', name: 'API Versioning', color: '#13c2c2', description: 'API 버전 호환성 이슈', industry: IndustryType.SOFTWARE, category: '개발인프라' },
  { id: 'it-8', name: 'Unit Test', color: '#52c41a', description: '테스트 코드 누락/오류', industry: IndustryType.SOFTWARE, category: '품질/안정성' },
  { id: 'it-9', name: 'Localization', color: '#2f54eb', description: '다국어 지원 이슈', industry: IndustryType.SOFTWARE, category: '기술/디자인' },

  // Manufacturing
  { id: 'mfg-1', name: 'PLC/HMI 오류', color: '#722ed1', description: '제어 시스템 연동 오류', industry: IndustryType.MANUFACTURING, category: '설비관리' },
  { id: 'mfg-2', name: 'Cycle Time 지연', color: '#fa8c16', description: '공정 택타임 미달', industry: IndustryType.MANUFACTURING, category: '현장공정' },
  { id: 'mfg-3', name: 'Lot 추적 불일치', color: '#13c2c2', description: 'Lot 추적 데이터 오류', industry: IndustryType.MANUFACTURING, category: '공급망' },
  { id: 'mfg-4', name: 'IQC/OQC 부적합', color: '#f5222d', description: '수입/출하 검사 부적합', industry: IndustryType.MANUFACTURING, category: '품질관리' },
  { id: 'mfg-5', name: 'BOM 불일치', color: '#eb2f96', description: '자재명세서 설정 오류', industry: IndustryType.MANUFACTURING, category: '공급망' },
  { id: 'mfg-6', name: '정기보전(PM)', color: '#52c41a', description: '설비 예방 보전 이슈', industry: IndustryType.MANUFACTURING, category: '설비관리' },
  { id: 'mfg-7', name: 'LOTO 안전지침', color: '#cf1322', description: '안전 잠금장치 준수 이슈', industry: IndustryType.MANUFACTURING, category: '안전보건' },
  { id: 'mfg-8', name: '금형 마모', color: '#a0d911', description: '금형 교체 주기 도래', industry: IndustryType.MANUFACTURING, category: '설비관리' },
  { id: 'mfg-9', name: '치수 부적합', color: '#fa541c', description: '정밀 측정치 허용범위 초과', industry: IndustryType.MANUFACTURING, category: '품질관리' },

  // Service/Business
  { id: 'svc-1', name: 'VIP 케어', color: '#eb2f96', description: 'VIP 고객 긴급 요청', industry: IndustryType.SERVICE, category: '고객지원' },
  { id: 'svc-2', name: 'SLA 미준수', color: '#f5222d', description: '서비스 수준 계약 지연', industry: IndustryType.SERVICE, category: '운영관리' },
  { id: 'svc-3', name: 'VOC 분석', color: '#1890ff', description: '고객의 소리 트렌드 분석', industry: IndustryType.SERVICE, category: '고객지원' },
  { id: 'svc-4', name: '프로모션 정산', color: '#722ed1', description: '이벤트 매출 정산 오류', industry: IndustryType.SERVICE, category: '비즈니스' },
  { id: 'svc-5', name: '물류 거점 지연', color: '#faad14', description: '허브/터미널 배송 지연', industry: IndustryType.SERVICE, category: '공급망/물류' },
  { id: 'svc-6', name: '채널 파트너십', color: '#13c2c2', description: '제휴 채널 연동 이슈', industry: IndustryType.SERVICE, category: '비즈니스' },
  { id: 'svc-7', name: 'CS 메뉴얼 가이드', color: '#52c41a', description: '상담 스크립트 보완 요구', industry: IndustryType.SERVICE, category: '고객지원' },

  // General
  { id: 'gen-1', name: '컴플라이언스', color: '#9c27b0', description: '법적 규제 대응', industry: IndustryType.GENERAL, category: '경영관리' },
  { id: 'gen-2', name: '예산 전용/추가', color: '#4caf50', description: '예산 조정 필요', industry: IndustryType.GENERAL, category: '경영지원' },
  { id: 'gen-3', name: '정보보안(ISMS)', color: '#f44336', description: '보안 인증 대응', industry: IndustryType.GENERAL, category: '사내보안' },
  { id: 'gen-4', name: '프로세스 표준화', color: '#607d8b', description: '업무 절차 문서화', industry: IndustryType.GENERAL, category: '공통업무' },
];


// 초기 데이터 없음
const sampleIssues: Issue[] = [];
const sampleComments: IssueComment[] = [];

export const useIssueStore = create<IssueStore>()(
  persist(
    (set, get) => ({
      issues: sampleIssues,
      comments: sampleComments,
      attachments: [],
      labels: defaultLabels,

      addIssue: (issueData) => {
        const id = `issue-${Date.now()}`;
        const newIssue: Issue = {
          ...issueData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ issues: [...state.issues, newIssue] }));
        return id;
      },

      updateIssue: (id, updates) => {
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, ...updates, updatedAt: new Date() } : issue
          ),
        }));
      },

      deleteIssue: (id) => {
        set((state) => ({
          issues: state.issues.filter((issue) => issue.id !== id),
          comments: state.comments.filter((c) => c.issueId !== id),
          attachments: state.attachments.filter((a) => a.issueId !== id),
        }));
      },

      changeStatus: (id, status) => {
        const updates: Partial<Issue> = { status, updatedAt: new Date() };
        if (status === IssueStatus.RESOLVED) updates.resolvedAt = new Date();
        else if (status === IssueStatus.CLOSED) updates.closedAt = new Date();
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, ...updates } : issue
          ),
        }));
      },

      assignIssue: (id, assigneeId, assigneeName) => {
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, assigneeId, assigneeName, updatedAt: new Date() } : issue
          ),
        }));
      },

      bulkUpdateIssues: (ids, updates) => {
        set((state) => ({
          issues: state.issues.map((issue) => {
            if (ids.includes(issue.id)) {
              const res: Issue = { ...issue, ...updates, updatedAt: new Date() };
              if (updates.status === IssueStatus.RESOLVED && !issue.resolvedAt) res.resolvedAt = new Date();
              if (updates.status === IssueStatus.CLOSED && !issue.closedAt) res.closedAt = new Date();
              return res;
            }
            return issue;
          }),
        }));
      },

      bulkDeleteIssues: (ids) => {
        set((state) => ({
          issues: state.issues.filter((issue) => !ids.includes(issue.id)),
          comments: state.comments.filter((c) => !ids.includes(c.issueId)),
          attachments: state.attachments.filter((a) => !ids.includes(a.issueId)),
        }));
      },

      addComment: (commentData) => {
        const newComment: IssueComment = {
          ...commentData,
          id: `comment-${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({ comments: [...state.comments, newComment] }));
      },

      updateComment: (id, content) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === id ? { ...c, content, updatedAt: new Date() } : c
          ),
        }));
      },

      deleteComment: (id) => {
        set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }));
      },

      addAttachment: (attachmentData) => {
        const newAttachment: IssueAttachment = {
          ...attachmentData,
          id: `attachment-${Date.now()}`,
          uploadedAt: new Date(),
        };
        set((state) => ({ attachments: [...state.attachments, newAttachment] }));
      },

      deleteAttachment: (id) => {
        set((state) => ({ attachments: state.attachments.filter((a) => a.id !== id) }));
      },

      addLabel: (labelData: Omit<IssueLabel, 'id'>) => {
        const newLabel: IssueLabel = { ...labelData, id: `label-${Date.now()}` };
        set((state) => ({ labels: [...state.labels, newLabel] }));
      },

      updateLabel: (id: string, updates: Partial<IssueLabel>) => {
        set((state) => ({
          labels: state.labels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));
      },

      deleteLabel: (id) => {
        set((state) => ({
          labels: state.labels.filter((l) => l.id !== id),
          issues: state.issues.map((issue) => ({
            ...issue,
            labels: issue.labels.filter((labelId) => labelId !== id),
          })),
        }));
      },

      resetLabelsToDefault: () => {
        set({ labels: defaultLabels });
      },

      initializeLabels: () => {
        const { labels } = get();
        // 이미 셋팅된 라벨이 충분히 있다면(예: 10개 이상) 건너뜀
        // 또는 특정 필수 라벨이 있는지 확인하여 없으면 defaultLabels를 합침
        const hasIndustryLabels = labels.some(l => l.industry !== undefined);

        if (!hasIndustryLabels || labels.length < 5) {
          set({ labels: defaultLabels });
        } else {
          // 기존 라벨에 없는 기본 라벨만 선별해서 추가 (중복 방지)
          const existingNames = new Set(labels.map(l => l.name));
          const missingDefaults = defaultLabels.filter(dl => !existingNames.has(dl.name));

          if (missingDefaults.length > 0) {
            set({ labels: [...labels, ...missingDefaults] });
          }
        }
      },

      getIssuesByProject: (projectId) => get().issues.filter((i) => i.projectId === projectId),
      getIssuesByAssignee: (assigneeId) => get().issues.filter((i) => i.assigneeId === assigneeId),
      getIssueComments: (issueId) =>
        get()
          .comments.filter((c) => c.issueId === issueId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      getIssueAttachments: (issueId) => get().attachments.filter((a) => a.issueId === issueId),
    }),
    { name: 'issue-storage' }
  )
);

// 유틸리티 함수들
export const getIssueTypeLabel = (type: IssueType, industry?: IndustryType): string => {
  if (industry === IndustryType.MANUFACTURING) {
    if (type === IssueType.TASK) return '생산 과업';
    if (type === IssueType.IMPROVEMENT) return '공정 개선';
    if (type === IssueType.QUESTION) return '현장 문의';
  }

  if (industry === IndustryType.SERVICE) {
    if (type === IssueType.BUG) return '상담 오류';
    if (type === IssueType.IMPROVEMENT) return '품질 고도화';
    if (type === IssueType.QUESTION) return '고객 문의';
  }

  const labels: Record<IssueType, string> = {
    [IssueType.BUG]: '버그',
    [IssueType.FEATURE]: '기능 요청',
    [IssueType.IMPROVEMENT]: '개선',
    [IssueType.QUESTION]: '질문',
    [IssueType.TASK]: '작업',
    [IssueType.DEFECT]: '품질 결함',
    [IssueType.EQUIPMENT]: '설비 장애',
    [IssueType.SAFETY]: '안전 이슈',
    [IssueType.QUALITY]: '공정 품질',
  };
  return labels[type];
};

export const getIssueTypeColor = (type: IssueType): string => {
  const colors: Record<IssueType, string> = {
    [IssueType.BUG]: '#f5222d',
    [IssueType.FEATURE]: '#722ed1',
    [IssueType.IMPROVEMENT]: '#1890ff',
    [IssueType.QUESTION]: '#faad14',
    [IssueType.TASK]: '#52c41a',
    [IssueType.DEFECT]: '#ff4d4f',
    [IssueType.EQUIPMENT]: '#fa8c16',
    [IssueType.SAFETY]: '#cf1322',
    [IssueType.QUALITY]: '#eb2f96',
  };
  return colors[type];
};

export const getIssueStatusLabel = (status: IssueStatus, industry?: IndustryType): string => {
  if (industry === IndustryType.MANUFACTURING) {
    const mfgLabels: Record<IssueStatus, string> = {
      [IssueStatus.OPEN]: '발생',
      [IssueStatus.IN_PROGRESS]: '조치중',
      [IssueStatus.RESOLVED]: '조치완료',
      [IssueStatus.CLOSED]: '검증완료',
      [IssueStatus.REOPENED]: '재발생',
    };
    return mfgLabels[status];
  }

  if (industry === IndustryType.SERVICE) {
    const svcLabels: Record<IssueStatus, string> = {
      [IssueStatus.OPEN]: '접수',
      [IssueStatus.IN_PROGRESS]: '처리중',
      [IssueStatus.RESOLVED]: '답변완료',
      [IssueStatus.CLOSED]: '처리종료',
      [IssueStatus.REOPENED]: '재접수',
    };
    return svcLabels[status];
  }

  const labels: Record<IssueStatus, string> = {
    [IssueStatus.OPEN]: '열림',
    [IssueStatus.IN_PROGRESS]: '진행중',
    [IssueStatus.RESOLVED]: '해결됨',
    [IssueStatus.CLOSED]: '종료',
    [IssueStatus.REOPENED]: '재오픈',
  };
  return labels[status];
};

export const getIssueStatusColor = (status: IssueStatus): string => {
  const colors: Record<IssueStatus, string> = {
    [IssueStatus.OPEN]: '#1890ff',
    [IssueStatus.IN_PROGRESS]: '#faad14',
    [IssueStatus.RESOLVED]: '#52c41a',
    [IssueStatus.CLOSED]: '#8c8c8c',
    [IssueStatus.REOPENED]: '#ff4d4f',
  };
  return colors[status];
};

export const getIssuePriorityLabel = (priority: IssuePriority, industry?: IndustryType): string => {
  if (industry === IndustryType.MANUFACTURING) {
    const mfgLabels: Record<IssuePriority, string> = {
      [IssuePriority.CRITICAL]: '즉시조치',
      [IssuePriority.HIGH]: '우선조치',
      [IssuePriority.MEDIUM]: '보통',
      [IssuePriority.LOW]: '장기과제',
    };
    return mfgLabels[priority];
  }

  if (industry === IndustryType.SERVICE) {
    const svcLabels: Record<IssuePriority, string> = {
      [IssuePriority.CRITICAL]: '긴급대응',
      [IssuePriority.HIGH]: '중점관리',
      [IssuePriority.MEDIUM]: '일반',
      [IssuePriority.LOW]: '참고',
    };
    return svcLabels[priority];
  }

  const labels: Record<IssuePriority, string> = {
    [IssuePriority.CRITICAL]: '긴급',
    [IssuePriority.HIGH]: '높음',
    [IssuePriority.MEDIUM]: '보통',
    [IssuePriority.LOW]: '낮음',
  };
  return labels[priority];
};

export const getIssuePriorityColor = (priority: IssuePriority): string => {
  const colors: Record<IssuePriority, string> = {
    [IssuePriority.CRITICAL]: '#f5222d',
    [IssuePriority.HIGH]: '#fa8c16',
    [IssuePriority.MEDIUM]: '#1890ff',
    [IssuePriority.LOW]: '#8c8c8c',
  };
  return colors[priority];
};

export const getIssueSeverityLabel = (severity: IssueSeverity, industry?: IndustryType): string => {
  if (industry === IndustryType.MANUFACTURING) {
    const mfgLabels: Record<IssueSeverity, string> = {
      [IssueSeverity.BLOCKER]: '심각 (라인 중단)',
      [IssueSeverity.MAJOR]: '중요 (품질 결함)',
      [IssueSeverity.MINOR]: '보통 (성능 저하)',
      [IssueSeverity.TRIVIAL]: '경미 (사소)',
    };
    return mfgLabels[severity];
  }

  if (industry === IndustryType.SERVICE) {
    const svcLabels: Record<IssueSeverity, string> = {
      [IssueSeverity.BLOCKER]: '매우 높음 (서비스 불능)',
      [IssueSeverity.MAJOR]: '높음 (주요 기능 장애)',
      [IssueSeverity.MINOR]: '보통 (일부 기능 제한)',
      [IssueSeverity.TRIVIAL]: '낮음 (단순 문의)',
    };
    return svcLabels[severity];
  }

  const labels: Record<IssueSeverity, string> = {
    [IssueSeverity.BLOCKER]: '블로커',
    [IssueSeverity.MAJOR]: '주요',
    [IssueSeverity.MINOR]: '경미',
    [IssueSeverity.TRIVIAL]: '사소',
  };
  return labels[severity];
};

export const getIssueSeverityColor = (severity: IssueSeverity): string => {
  const colors: Record<IssueSeverity, string> = {
    [IssueSeverity.BLOCKER]: '#f5222d',
    [IssueSeverity.MAJOR]: '#fa8c16',
    [IssueSeverity.MINOR]: '#faad14',
    [IssueSeverity.TRIVIAL]: '#8c8c8c',
  };
  return colors[severity];
};
