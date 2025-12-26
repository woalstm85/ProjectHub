import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// [수정] enum을 const 객체 + type으로 변경
export const ActivityType = {
  // 작업 관련
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',

  // 프로젝트 관련
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_COMPLETED: 'PROJECT_COMPLETED',

  // 팀원 관련
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_UPDATED: 'MEMBER_UPDATED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
} as const;

// ActivityType의 값들을 타입으로 추출
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

// Activity 인터페이스 - 반드시 export
export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: Date;
  userId?: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  memberId?: string;
  memberName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
}

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getActivitiesByProject: (projectId: string) => Activity[];
  getActivitiesByMember: (memberId: string) => Activity[];
  getRecentActivities: (limit?: number) => Activity[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activityData) => {
        const activity: Activity = {
          ...activityData,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 500),
        }));
      },

      clearActivities: () => set({ activities: [] }),

      getActivitiesByProject: (projectId: string) => {
        return get().activities.filter((a) => a.projectId === projectId);
      },

      getActivitiesByMember: (memberId: string) => {
        return get().activities.filter((a) => a.userId === memberId || a.memberId === memberId);
      },

      getRecentActivities: (limit = 50) => {
        return get().activities.slice(0, limit);
      },
    }),
    {
      name: 'activity-storage',
    }
  )
);

// 활동 타입별 메시지 생성 헬퍼
export function getActivityMessage(activity: Activity): string {
  switch (activity.type) {
    case ActivityType.TASK_CREATED:
      return `새 작업 "${activity.taskName}"을(를) 생성했습니다`;
    case ActivityType.TASK_UPDATED:
      return `작업 "${activity.taskName}"을(를) 수정했습니다`;
    case ActivityType.TASK_DELETED:
      return `작업 "${activity.taskName}"을(를) 삭제했습니다`;
    case ActivityType.TASK_STATUS_CHANGED:
      return `작업 "${activity.taskName}" 상태를 ${activity.oldValue}에서 ${activity.newValue}(으)로 변경했습니다`;
    case ActivityType.TASK_ASSIGNED:
      return `작업 "${activity.taskName}"을(를) ${activity.newValue}에게 할당했습니다`;
    case ActivityType.PROJECT_CREATED:
      return `새 프로젝트 "${activity.projectName}"을(를) 생성했습니다`;
    case ActivityType.PROJECT_UPDATED:
      return `프로젝트 "${activity.projectName}"을(를) 수정했습니다`;
    case ActivityType.PROJECT_DELETED:
      return `프로젝트 "${activity.projectName}"을(를) 삭제했습니다`;
    case ActivityType.PROJECT_COMPLETED:
      return `프로젝트 "${activity.projectName}"을(를) 완료했습니다`;
    case ActivityType.MEMBER_ADDED:
      return `새 팀원 "${activity.memberName}"을(를) 추가했습니다`;
    case ActivityType.MEMBER_UPDATED:
      return `팀원 "${activity.memberName}" 정보를 수정했습니다`;
    case ActivityType.MEMBER_REMOVED:
      return `팀원 "${activity.memberName}"을(를) 제거했습니다`;
    default:
      return activity.description || '활동이 기록되었습니다';
  }
}

// 활동 타입별 아이콘 이름
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case ActivityType.TASK_CREATED:
      return 'plus-circle';
    case ActivityType.TASK_UPDATED:
      return 'edit';
    case ActivityType.TASK_DELETED:
      return 'delete';
    case ActivityType.TASK_STATUS_CHANGED:
      return 'swap';
    case ActivityType.TASK_ASSIGNED:
      return 'user';
    case ActivityType.PROJECT_CREATED:
      return 'folder-add';
    case ActivityType.PROJECT_UPDATED:
      return 'folder';
    case ActivityType.PROJECT_DELETED:
      return 'folder-delete';
    case ActivityType.PROJECT_COMPLETED:
      return 'check-circle';
    case ActivityType.MEMBER_ADDED:
      return 'user-add';
    case ActivityType.MEMBER_UPDATED:
      return 'user';
    case ActivityType.MEMBER_REMOVED:
      return 'user-delete';
    default:
      return 'info-circle';
  }
}

// 활동 타입별 색상
export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case ActivityType.TASK_CREATED:
    case ActivityType.PROJECT_CREATED:
    case ActivityType.MEMBER_ADDED:
      return '#52c41a';
    case ActivityType.TASK_UPDATED:
    case ActivityType.PROJECT_UPDATED:
    case ActivityType.MEMBER_UPDATED:
    case ActivityType.TASK_ASSIGNED:
      return '#1890ff';
    case ActivityType.TASK_DELETED:
    case ActivityType.PROJECT_DELETED:
    case ActivityType.MEMBER_REMOVED:
      return '#ff4d4f';
    case ActivityType.TASK_STATUS_CHANGED:
      return '#faad14';
    case ActivityType.PROJECT_COMPLETED:
      return '#722ed1';
    default:
      return '#8c8c8c';
  }
}
