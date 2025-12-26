import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProjectStore } from './projectStore';
import { useActivityStore, ActivityType } from './activityStore';
import { useAuthStore } from './authStore';

// 작업 상태
export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// 작업 우선순위
export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

// 상태 한글명
const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: '할일',
  [TaskStatus.IN_PROGRESS]: '진행중',
  [TaskStatus.REVIEW]: '검토중',
  [TaskStatus.DONE]: '완료',
};

// 작업 인터페이스
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 작업 생성 DTO
export interface CreateTaskDTO {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  estimatedCost?: number;
}

// 프로젝트 진행률 계산 함수
const calculateProjectProgress = (tasks: Task[], projectId: string): number => {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  
  if (projectTasks.length === 0) return 0;
  
  const weights = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0.5,
    [TaskStatus.REVIEW]: 0.8,
    [TaskStatus.DONE]: 1,
  };
  
  const totalProgress = projectTasks.reduce((sum, task) => {
    return sum + weights[task.status];
  }, 0);
  
  return (totalProgress / projectTasks.length) * 100;
};

// 프로젝트 예산 계산 함수
const calculateProjectBudget = (tasks: Task[], projectId: string): number => {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  
  return projectTasks.reduce((sum, task) => {
    return sum + (task.actualCost || task.estimatedCost || 0);
  }, 0);
};

interface TaskStore {
  tasks: Task[];
  
  addTask: (task: CreateTaskDTO) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (projectId: string, status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData: CreateTaskDTO) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          startDate: taskData.startDate,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 프로젝트 정보 가져오기
        const project = useProjectStore.getState().projects.find(p => p.id === taskData.projectId);
        const user = useAuthStore.getState().user;

        set((state) => {
          const newTasks = [...state.tasks, newTask];
          
          // 프로젝트 진행률 자동 업데이트
          const progress = calculateProjectProgress(newTasks, taskData.projectId);
          useProjectStore.getState().updateProjectProgress(taskData.projectId, progress);
          
          // 프로젝트 예산 자동 업데이트
          const spentBudget = calculateProjectBudget(newTasks, taskData.projectId);
          useProjectStore.getState().updateProjectBudget(taskData.projectId, spentBudget);
          
          return { tasks: newTasks };
        });

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.TASK_CREATED,
          userId: user?.id,
          userName: user?.name || '사용자',
          projectId: taskData.projectId,
          projectName: project?.name,
          taskId: newTask.id,
          taskName: newTask.title,
        });
      },

      updateTask: (id: string, updatedData: Partial<Task>) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        const project = useProjectStore.getState().projects.find(p => p.id === task.projectId);
        const user = useAuthStore.getState().user;
        const oldStatus = task.status;

        set((state) => {
          const newTasks = state.tasks.map((t) =>
            t.id === id
              ? { ...t, ...updatedData, updatedAt: new Date() }
              : t
          );
          
          // 프로젝트 진행률 자동 업데이트
          const progress = calculateProjectProgress(newTasks, task.projectId);
          useProjectStore.getState().updateProjectProgress(task.projectId, progress);
          
          // 프로젝트 예산 자동 업데이트
          const spentBudget = calculateProjectBudget(newTasks, task.projectId);
          useProjectStore.getState().updateProjectBudget(task.projectId, spentBudget);
          
          return { tasks: newTasks };
        });

        // 활동 기록 - 상태 변경인 경우
        if (updatedData.status && updatedData.status !== oldStatus) {
          useActivityStore.getState().addActivity({
            type: ActivityType.TASK_STATUS_CHANGED,
            userId: user?.id,
            userName: user?.name || '사용자',
            projectId: task.projectId,
            projectName: project?.name,
            taskId: task.id,
            taskName: task.title,
            oldValue: statusLabels[oldStatus],
            newValue: statusLabels[updatedData.status],
          });
        } else {
          // 일반 수정인 경우
          useActivityStore.getState().addActivity({
            type: ActivityType.TASK_UPDATED,
            userId: user?.id,
            userName: user?.name || '사용자',
            projectId: task.projectId,
            projectName: project?.name,
            taskId: task.id,
            taskName: updatedData.title || task.title,
          });
        }
      },

      deleteTask: (id: string) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        const project = useProjectStore.getState().projects.find(p => p.id === task.projectId);
        const user = useAuthStore.getState().user;

        set((state) => {
          const newTasks = state.tasks.filter((t) => t.id !== id);
          
          // 프로젝트 진행률 자동 업데이트
          const progress = calculateProjectProgress(newTasks, task.projectId);
          useProjectStore.getState().updateProjectProgress(task.projectId, progress);
          
          // 프로젝트 예산 자동 업데이트
          const spentBudget = calculateProjectBudget(newTasks, task.projectId);
          useProjectStore.getState().updateProjectBudget(task.projectId, spentBudget);
          
          return { tasks: newTasks };
        });

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.TASK_DELETED,
          userId: user?.id,
          userName: user?.name || '사용자',
          projectId: task.projectId,
          projectName: project?.name,
          taskId: task.id,
          taskName: task.title,
        });
      },

      getTasksByProject: (projectId: string) => {
        return get().tasks.filter((task) => task.projectId === projectId);
      },

      getTasksByStatus: (projectId: string, status: TaskStatus) => {
        return get().tasks.filter(
          (task) => task.projectId === projectId && task.status === status
        );
      },
    }),
    {
      name: 'task-storage',
    }
  )
);
