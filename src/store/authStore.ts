import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemberStore } from './memberStore';

// 사용자 인터페이스
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  memberId?: string; // 연결된 팀원 ID
  avatar?: string;
  createdAt: Date;
}

// 로그인 DTO
export interface LoginDTO {
  username: string;
  password: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;

  login: (credentials: LoginDTO) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

// 임시 사용자 데이터 (메모리 저장)
const DEMO_USERS = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    name: '관리자',
    email: 'admin@example.com',
    role: 'admin' as const,
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    username: 'demo',
    password: 'demo123',
    name: '데모 사용자',
    email: 'demo@example.com',
    role: 'member' as const,
    memberId: 'member-demo', // memberStore에 이 ID로 멤버가 있어야 함
    createdAt: new Date(),
  },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (credentials: LoginDTO): Promise<boolean> => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 1. 기존 데모 사용자 확인 (admin 등)
        const foundDemoUser = DEMO_USERS.find(
          (u) => (u.username === credentials.username || u.email === credentials.username) && u.password === credentials.password
        );

        if (foundDemoUser) {
          const { password, ...userWithoutPassword } = foundDemoUser;
          set({
            user: userWithoutPassword as User,
            isAuthenticated: true,
          });
          return true;
        }

        // 2. 팀원 관리(memberStore)에 있는 사람인지 확인
        // 샘플이므로 비밀번호는 1234로 통일
        const members = useMemberStore.getState().members;
        const foundMember = members.find(m => m.email === credentials.username && credentials.password === '1234');

        if (foundMember) {
          const newUser: User = {
            id: `user-${foundMember.id}`,
            username: foundMember.email.split('@')[0],
            name: foundMember.name,
            email: foundMember.email,
            role: 'member',
            memberId: foundMember.id,
            avatar: foundMember.avatar,
            createdAt: new Date(),
          };
          set({
            user: newUser,
            isAuthenticated: true,
          });
          return true;
        }

        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
