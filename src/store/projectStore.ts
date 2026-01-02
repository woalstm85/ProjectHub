import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore, ActivityType } from './activityStore';
import { useAuthStore } from './authStore';
import { useMessageStore } from './messageStore';
import { useMemberStore } from './memberStore';

// 산업군 타입
export const IndustryType = {
  SOFTWARE: 'SOFTWARE',
  MANUFACTURING: 'MANUFACTURING',
  SERVICE: 'SERVICE',
  GENERAL: 'GENERAL',
} as const;
export type IndustryType = (typeof IndustryType)[keyof typeof IndustryType];

// 프로젝트 상태
export const ProjectStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

// 프로젝트 우선순위
export const ProjectPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type ProjectPriority = (typeof ProjectPriority)[keyof typeof ProjectPriority];

// 방법론 (하위 호환성을 위해 유지)
export const Methodology = {
  WATERFALL: 'WATERFALL',
  AGILE: 'AGILE',
  SCRUM: 'SCRUM',
  KANBAN: 'KANBAN',
} as const;
export type Methodology = (typeof Methodology)[keyof typeof Methodology];

// 프로젝트 인터페이스
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  methodology?: Methodology;
  teamSize: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  budget: number;
  spentBudget: number;
  teamMembers: string[];
  industry: IndustryType;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
}

// 프로젝트 생성 DTO
export interface CreateProjectDTO {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  industry: IndustryType;
  methodology?: Methodology;
  teamSize: number;
  teamMembers: string[];
  startDate: Date;
  endDate: Date;
  budget: number;
}

interface ProjectStore {
  projects: Project[];
  selectedProject: Project | null;

  addProject: (project: CreateProjectDTO) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProject: (project: Project | null) => void;
  getProjectById: (id: string) => Project | undefined;
  updateProjectProgress: (projectId: string, tasksProgress: number) => void;
  updateProjectBudget: (projectId: string, spentBudget: number) => void;
  toggleFavorite: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [
        {
          id: 'project-1',
          name: '차세대 ERP 구축',
          description: '전사 자원 관리 시스템 고도화',
          status: ProjectStatus.IN_PROGRESS,
          priority: ProjectPriority.HIGH,
          industry: IndustryType.SOFTWARE,
          teamSize: 12,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          progress: 35,
          budget: 500000000,
          spentBudget: 156000000,
          teamMembers: ['member-1', 'member-2', 'member-demo'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          name: '스마트 팩토리 도입',
          description: '생산 라인 자동화 및 실시간 모니터링 시스템 구축',
          status: ProjectStatus.PLANNING,
          priority: ProjectPriority.URGENT,
          industry: IndustryType.MANUFACTURING,
          teamSize: 8,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-09-30'),
          progress: 10,
          budget: 300000000,
          spentBudget: 25000000,
          teamMembers: ['member-3', 'member-4', 'member-demo'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      selectedProject: null,

      addProject: (projectData: CreateProjectDTO) => {
        const newProject: Project = {
          ...projectData,
          id: `project-${Date.now()}`,
          progress: 0,
          spentBudget: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: false,
        };

        const user = useAuthStore.getState().user;

        set((state) => ({
          projects: [...state.projects, newProject],
        }));

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.PROJECT_CREATED,
          userId: user?.id,
          userName: user?.name || '사용자',
          projectId: newProject.id,
          projectName: newProject.name,
        });

        // 팀원들에게 프로젝트 배정 알림 발송
        if (newProject.teamMembers && newProject.teamMembers.length > 0) {
          const messageStore = useMessageStore.getState();
          const memberStore = useMemberStore.getState();

          newProject.teamMembers.forEach(memberId => {
            const member = memberStore.getMemberById(memberId);
            if (member) {
              messageStore.sendMessage({
                senderId: user?.id || 'admin',
                senderName: user?.name || '관리자',
                receiverId: member.id,
                receiverName: member.name,
                content: `[새 프로젝트] '${newProject.name}' 프로젝트에 배정되었습니다.`,
              });
            }
          });
        }
      },

      updateProject: (id: string, updatedData: Partial<Project>) => {
        const project = get().projects.find(p => p.id === id);
        if (!project) return;

        const user = useAuthStore.getState().user;
        const wasCompleted = project.status === ProjectStatus.COMPLETED;
        const isNowCompleted = updatedData.status === ProjectStatus.COMPLETED;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updatedData, updatedAt: new Date() }
              : p
          ),
        }));

        // 활동 기록 - 완료로 변경된 경우
        if (!wasCompleted && isNowCompleted) {
          useActivityStore.getState().addActivity({
            type: ActivityType.PROJECT_COMPLETED,
            userId: user?.id,
            userName: user?.name || '사용자',
            projectId: project.id,
            projectName: updatedData.name || project.name,
          });
        } else {
          // 일반 수정인 경우
          useActivityStore.getState().addActivity({
            type: ActivityType.PROJECT_UPDATED,
            userId: user?.id,
            userName: user?.name || '사용자',
            projectId: project.id,
            projectName: updatedData.name || project.name,
          });
        }

        // 새로 추가된 팀원들에게 알림 발송
        if (updatedData.teamMembers) {
          const newMembers = updatedData.teamMembers.filter(mId => !project.teamMembers.includes(mId));
          if (newMembers.length > 0) {
            const messageStore = useMessageStore.getState();
            const memberStore = useMemberStore.getState();

            newMembers.forEach(memberId => {
              const member = memberStore.getMemberById(memberId);
              if (member) {
                messageStore.sendMessage({
                  senderId: user?.id || 'admin',
                  senderName: user?.name || '관리자',
                  receiverId: member.id,
                  receiverName: member.name,
                  content: `[프로젝트 초대] '${updatedData.name || project.name}' 프로젝트에 초대되었습니다.`,
                });
              }
            });
          }
        }
      },

      deleteProject: (id: string) => {
        const project = get().projects.find(p => p.id === id);
        if (!project) return;

        const user = useAuthStore.getState().user;

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
        }));

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.PROJECT_DELETED,
          userId: user?.id,
          userName: user?.name || '사용자',
          projectId: project.id,
          projectName: project.name,
        });
      },

      setSelectedProject: (project: Project | null) => {
        set({ selectedProject: project });
      },

      getProjectById: (id: string) => {
        return get().projects.find((project) => project.id === id);
      },

      updateProjectProgress: (projectId: string, tasksProgress: number) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, progress: Math.round(tasksProgress), updatedAt: new Date() }
              : project
          ),
        }));
      },

      updateProjectBudget: (projectId: string, spentBudget: number) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, spentBudget: Math.round(spentBudget), updatedAt: new Date() }
              : project
          ),
        }));
      },

      toggleFavorite: (id: string) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, isFavorite: !project.isFavorite }
              : project
          ),
        }));
      },
    }),
    {
      name: 'project-storage',
    }
  )
);
