import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 산업군 타입
export const IndustryType = {
  SOFTWARE: 'SOFTWARE',
  MANUFACTURING: 'MANUFACTURING',
  SERVICE: 'SERVICE',
  GENERAL: 'GENERAL',
} as const;
export type IndustryType = (typeof IndustryType)[keyof typeof IndustryType];

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
  industry: IndustryType;
  setIndustry: (industry: IndustryType) => void;
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
  getIssuesByProject: (projectId: string) => Issue[];
  getIssuesByAssignee: (assigneeId: string) => Issue[];
  getIssueComments: (issueId: string) => IssueComment[];
  getIssueAttachments: (issueId: string) => IssueAttachment[];
}

// 제조업 맞춤 라벨
const defaultLabels: IssueLabel[] = [
  { id: 'label-1', name: '생산라인', color: '#722ed1', description: '생산라인 관련' },
  { id: 'label-2', name: '품질관리', color: '#f5222d', description: '품질관리 관련' },
  { id: 'label-3', name: '설비', color: '#fa8c16', description: '설비/장비 관련' },
  { id: 'label-4', name: '자재', color: '#13c2c2', description: '자재/원자재 관련' },
  { id: 'label-5', name: '안전', color: '#ff4d4f', description: '안전사고 관련' },
  { id: 'label-6', name: '납기', color: '#1890ff', description: '납기/일정 관련' },
  { id: 'label-7', name: '공정개선', color: '#52c41a', description: '공정개선 관련' },
  { id: 'label-8', name: '고객클레임', color: '#eb2f96', description: '고객 클레임 관련' },
  { id: 'label-9', name: '물류', color: '#faad14', description: '물류/출하 관련' },
  { id: 'label-10', name: '금형', color: '#8c8c8c', description: '금형/치공구 관련' },
];

// 초기 데이터 없음
const sampleIssues: Issue[] = [];
const sampleComments: IssueComment[] = [];

export const useIssueStore = create<IssueStore>()(
  persist(
    (set, get) => ({
      industry: IndustryType.SOFTWARE,
      setIndustry: (industry) => set({ industry }),
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

      addLabel: (labelData) => {
        const newLabel: IssueLabel = { ...labelData, id: `label-${Date.now()}` };
        set((state) => ({ labels: [...state.labels, newLabel] }));
      },

      updateLabel: (id, updates) => {
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
export const getIssueTypeLabel = (type: IssueType): string => {
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

export const getIssueStatusLabel = (status: IssueStatus): string => {
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

export const getIssuePriorityLabel = (priority: IssuePriority): string => {
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

export const getIssueSeverityLabel = (severity: IssueSeverity): string => {
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
