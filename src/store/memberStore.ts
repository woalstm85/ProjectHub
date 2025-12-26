import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivityStore, ActivityType } from './activityStore';
import { useAuthStore } from './authStore';

// 팀원 역할
// 팀원 역할
export const MemberRole = {
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
  DESIGNER: 'DESIGNER',
  QA: 'QA',
  ANALYST: 'ANALYST',
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

// 팀원 인터페이스
// 팀원 인터페이스
export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar?: string;
  department?: string;
  skills?: string[];
  status?: 'online' | 'offline' | 'busy' | 'vacation' | 'meeting';
  phone?: string;
  joinDate?: Date;
}

// 팀원 생성 DTO
export interface CreateMemberDTO {
  name: string;
  email: string;
  role: MemberRole;
  department?: string;
  skills?: string[];
  status?: 'online' | 'offline' | 'busy' | 'vacation' | 'meeting';
  phone?: string;
  joinDate?: Date;
}

interface MemberStore {
  members: Member[];

  addMember: (member: CreateMemberDTO) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set, get) => ({
      members: [],

      addMember: (memberData: CreateMemberDTO) => {
        const newMember: Member = {
          ...memberData,
          id: `member-${Date.now()}`,
        };

        const user = useAuthStore.getState().user;

        set((state) => ({
          members: [...state.members, newMember],
        }));

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.MEMBER_ADDED,
          userId: user?.id,
          userName: user?.name || '사용자',
          memberId: newMember.id,
          memberName: newMember.name,
        });
      },

      updateMember: (id: string, updatedData: Partial<Member>) => {
        const member = get().members.find(m => m.id === id);
        if (!member) return;

        const user = useAuthStore.getState().user;

        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updatedData } : m
          ),
        }));

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.MEMBER_UPDATED,
          userId: user?.id,
          userName: user?.name || '사용자',
          memberId: member.id,
          memberName: updatedData.name || member.name,
        });
      },

      deleteMember: (id: string) => {
        const member = get().members.find(m => m.id === id);
        if (!member) return;

        const user = useAuthStore.getState().user;

        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));

        // 활동 기록
        useActivityStore.getState().addActivity({
          type: ActivityType.MEMBER_REMOVED,
          userId: user?.id,
          userName: user?.name || '사용자',
          memberId: member.id,
          memberName: member.name,
        });
      },

      getMemberById: (id: string) => {
        return get().members.find((member) => member.id === id);
      },
    }),
    {
      name: 'member-storage',
    }
  )
);
