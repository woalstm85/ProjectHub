import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 이슈 타입
export const IssueType = {
  BUG: 'BUG',
  FEATURE: 'FEATURE',
  IMPROVEMENT: 'IMPROVEMENT',
  QUESTION: 'QUESTION',
  TASK: 'TASK',
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

// 이슈 심각도 (버그용)
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
  environment?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
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

// 제조업 샘플 이슈 데이터
const sampleIssues: Issue[] = [
  {
    id: 'issue-1',
    projectId: 'project-1',
    title: '[긴급] A라인 사출기 #3 온도센서 이상',
    description: '사출기 #3번의 온도센서가 실제 온도보다 15도 낮게 표시됨.\n이로 인해 제품 불량률이 급증하고 있음.\n\n현재 수동으로 온도 보정 중이나, 조속한 센서 교체 필요.',
    type: IssueType.BUG,
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.CRITICAL,
    severity: IssueSeverity.BLOCKER,
    reporterId: 'member-1',
    reporterName: '김생산',
    assigneeId: 'member-2',
    assigneeName: '박정비',
    labels: ['label-3', 'label-1'],
    createdAt: new Date('2024-01-15T08:30:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    environment: 'A동 1층 사출라인',
    stepsToReproduce: '1. 사출기 #3 가동\n2. 온도계로 실제 배럴 온도 측정\n3. HMI 표시 온도와 비교',
    expectedResult: '실제 온도와 HMI 표시 온도 일치 (±2도 이내)',
    actualResult: '실제 235도, HMI 표시 220도 (15도 차이)',
  },
  {
    id: 'issue-2',
    projectId: 'project-1',
    title: '2월 납기분 LED 하우징 원자재 부족 예상',
    description: 'PC수지 (폴리카보네이트) 재고가 2월 생산 물량 대비 30% 부족 예상.\n\n현재 재고: 5톤\n2월 예상 소요량: 7톤\n부족량: 2톤\n\n구매팀 긴급 발주 요청 필요.',
    type: IssueType.TASK,
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    reporterId: 'member-3',
    reporterName: '이자재',
    labels: ['label-4', 'label-6'],
    createdAt: new Date('2024-01-16T09:00:00'),
    updatedAt: new Date('2024-01-16T09:00:00'),
    dueDate: new Date('2024-01-25'),
  },
  {
    id: 'issue-3',
    projectId: 'project-1',
    title: '고객사 A전자 클레임 - 외관 스크래치 불량',
    description: 'A전자 납품분 LED 하우징 제품에서 외관 스크래치 불량 발생.\n\n- 불량 수량: 150개 / 10,000개 (불량률 1.5%)\n- 발생 원인: 포장 공정 취급 부주의 추정\n- 고객 요구: 원인 분석 보고서 및 대책 수립\n\n긴급 품질회의 소집 필요.',
    type: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.CRITICAL,
    severity: IssueSeverity.MAJOR,
    reporterId: 'member-4',
    reporterName: '최품질',
    labels: ['label-2', 'label-8'],
    createdAt: new Date('2024-01-17T14:00:00'),
    updatedAt: new Date('2024-01-17T14:00:00'),
    dueDate: new Date('2024-01-20'),
  },
  {
    id: 'issue-4',
    projectId: 'project-1',
    title: 'B라인 조립공정 사이클타임 단축 제안',
    description: '현재 B라인 조립공정 사이클타임: 45초/개\n\n개선안:\n1. 지그 개선으로 부품 세팅시간 단축 (예상 -5초)\n2. 작업 동선 개선 (예상 -3초)\n3. 반자동 체결 도구 도입 (예상 -7초)\n\n예상 개선 후 사이클타임: 30초/개 (33% 개선)\n예상 생산성 향상: 일 800개 → 1,200개',
    type: IssueType.IMPROVEMENT,
    status: IssueStatus.OPEN,
    priority: IssuePriority.MEDIUM,
    reporterId: 'member-5',
    reporterName: '정개선',
    labels: ['label-7', 'label-1'],
    createdAt: new Date('2024-01-18T11:00:00'),
    updatedAt: new Date('2024-01-18T11:00:00'),
  },
  {
    id: 'issue-5',
    projectId: 'project-1',
    title: 'CNC 가공기 #2 이상소음 발생',
    description: '1월 15일부터 CNC #2에서 베어링 마모로 추정되는 이상소음 발생.\n\n- 발생 시점: 고속 회전(8,000rpm 이상) 시\n- 소음 유형: 고주파 금속성 마찰음\n- 가공 정밀도: 현재까지 이상 없음\n\n예방정비 차원에서 점검 필요.',
    type: IssueType.BUG,
    status: IssueStatus.RESOLVED,
    priority: IssuePriority.HIGH,
    severity: IssueSeverity.MINOR,
    reporterId: 'member-1',
    reporterName: '김생산',
    assigneeId: 'member-2',
    assigneeName: '박정비',
    labels: ['label-3'],
    createdAt: new Date('2024-01-15T16:00:00'),
    updatedAt: new Date('2024-01-18T09:00:00'),
    resolvedAt: new Date('2024-01-18T09:00:00'),
    environment: 'B동 CNC 가공실',
  },
  {
    id: 'issue-6',
    projectId: 'project-1',
    title: '신규 금형 T1 샘플 승인 요청',
    description: '신규 금형 "LH-2024-001" T1 샘플 제작 완료.\n\n금형 정보:\n- 제품명: 자동차 인테리어 커버\n- 캐비티: 4\n- 금형 제작사: 대한금형\n\nT1 샘플 치수 측정 결과 첨부 예정.\n품질팀 검토 및 승인 요청.',
    type: IssueType.TASK,
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.HIGH,
    reporterId: 'member-6',
    reporterName: '한금형',
    assigneeId: 'member-4',
    assigneeName: '최품질',
    labels: ['label-10', 'label-2'],
    createdAt: new Date('2024-01-19T10:00:00'),
    updatedAt: new Date('2024-01-19T14:00:00'),
    dueDate: new Date('2024-01-22'),
  },
  {
    id: 'issue-7',
    projectId: 'project-1',
    title: '출하장 지게차 안전사고 아차사례 보고',
    description: '1월 18일 15:30경 출하장에서 지게차와 작업자 간 아차사고 발생.\n\n상황:\n- 지게차 후진 시 후방 작업자 미확인\n- 작업자가 스스로 피해 사고 미발생\n\n원인 분석:\n- 후방 경고등 고장 상태에서 운행\n- 출하장 내 보행로 미지정\n\n즉시 시정조치 필요.',
    type: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.CRITICAL,
    severity: IssueSeverity.BLOCKER,
    reporterId: 'member-7',
    reporterName: '오안전',
    labels: ['label-5', 'label-9'],
    createdAt: new Date('2024-01-18T16:00:00'),
    updatedAt: new Date('2024-01-18T16:00:00'),
    environment: 'C동 출하장',
    stepsToReproduce: '해당없음 (안전사고 아차사례)',
    expectedResult: '지게차 후진 시 경고음 및 경고등 작동, 보행로 분리',
    actualResult: '경고등 미작동, 보행로 미구분',
  },
  {
    id: 'issue-8',
    projectId: 'project-1',
    title: '바코드 스캐너 MES 연동 오류',
    description: '포장라인 바코드 스캐너가 MES 시스템과 간헐적 통신 끊김 발생.\n\n- 발생 빈도: 1시간에 2~3회\n- 지속 시간: 약 30초~1분\n- 영향: 실시간 생산실적 누락\n\nIT팀 네트워크 점검 요청.',
    type: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.MEDIUM,
    severity: IssueSeverity.MINOR,
    reporterId: 'member-1',
    reporterName: '김생산',
    labels: ['label-1'],
    createdAt: new Date('2024-01-19T08:00:00'),
    updatedAt: new Date('2024-01-19T08:00:00'),
    environment: '포장라인 MES 단말기',
  },
  {
    id: 'issue-9',
    projectId: 'project-1',
    title: 'C사 신규 수주 생산계획 수립 요청',
    description: 'C사 신규 수주 확정.\n\n주문 내용:\n- 제품: 전자부품 케이스 (PC-001)\n- 수량: 월 50,000개\n- 납기: 2024년 3월 1일 첫 납품\n- 계약기간: 1년\n\n생산팀 생산계획 수립 및 설비 가동률 검토 필요.',
    type: IssueType.FEATURE,
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    reporterId: 'member-8',
    reporterName: '강영업',
    labels: ['label-6', 'label-1'],
    createdAt: new Date('2024-01-19T11:00:00'),
    updatedAt: new Date('2024-01-19T11:00:00'),
    dueDate: new Date('2024-02-01'),
  },
  {
    id: 'issue-10',
    projectId: 'project-1',
    title: '도장라인 컨베이어 속도 불균일 문제',
    description: '도장라인 컨베이어 속도가 구간별로 불균일하여 도막 두께 편차 발생.\n\n측정 결과:\n- 1구간: 3.2m/min\n- 2구간: 3.5m/min  \n- 3구간: 3.0m/min\n\n기준: 3.2m/min ±0.1\n\n인버터 및 구동모터 점검 필요.',
    type: IssueType.BUG,
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.HIGH,
    severity: IssueSeverity.MAJOR,
    reporterId: 'member-9',
    reporterName: '윤도장',
    assigneeId: 'member-2',
    assigneeName: '박정비',
    labels: ['label-3', 'label-2'],
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-18T14:00:00'),
    environment: 'A동 2층 도장라인',
  },
];

// 샘플 댓글
const sampleComments: IssueComment[] = [
  {
    id: 'comment-1',
    issueId: 'issue-1',
    authorId: 'member-2',
    authorName: '박정비',
    content: '온도센서 교체 부품 발주 완료했습니다. 1월 17일 입고 예정이며, 입고 즉시 교체 작업 진행하겠습니다.',
    createdAt: new Date('2024-01-15T11:00:00'),
  },
  {
    id: 'comment-2',
    issueId: 'issue-1',
    authorId: 'member-1',
    authorName: '김생산',
    content: '임시 대책으로 외부 온도계 설치하여 작업자가 수동 모니터링 중입니다.',
    createdAt: new Date('2024-01-15T14:00:00'),
  },
  {
    id: 'comment-3',
    issueId: 'issue-3',
    authorId: 'member-4',
    authorName: '최품질',
    content: '1차 원인 분석 결과, 포장 박스 내부 완충재 부족이 원인으로 확인되었습니다. 포장 규격 변경 검토 중입니다.',
    createdAt: new Date('2024-01-17T16:00:00'),
  },
  {
    id: 'comment-4',
    issueId: 'issue-5',
    authorId: 'member-2',
    authorName: '박정비',
    content: '스핀들 베어링 교체 완료. 시운전 결과 이상소음 해소 확인. 예방정비 주기를 6개월→4개월로 단축 권고드립니다.',
    createdAt: new Date('2024-01-18T09:00:00'),
  },
  {
    id: 'comment-5',
    issueId: 'issue-6',
    authorId: 'member-4',
    authorName: '최품질',
    content: 'T1 샘플 치수 측정 완료. 일부 항목(내경 치수) spec out 확인. 금형 수정 후 T2 샘플 요청 예정입니다.',
    createdAt: new Date('2024-01-19T15:00:00'),
  },
];

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
