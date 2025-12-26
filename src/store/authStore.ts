import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 인터페이스
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
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
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    username: 'demo',
    password: 'demo123',
    name: '데모 사용자',
    email: 'demo@example.com',
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

        const foundUser = DEMO_USERS.find(
          (u) => u.username === credentials.username && u.password === credentials.password
        );

        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser;
          set({
            user: userWithoutPassword as User,
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
    }
  )
);
