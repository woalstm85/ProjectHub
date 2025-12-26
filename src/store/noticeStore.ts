import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notice {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    targetType: 'ALL' | 'SELECTED';
    targetMemberIds?: string[];
    isImportant: boolean;
    createdAt: Date;
}

interface NoticeStore {
    notices: Notice[];
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt'>) => void;
    deleteNotice: (id: string) => void;
    updateNotice: (id: string, updates: Partial<Notice>) => void;
}

export const useNoticeStore = create<NoticeStore>()(
    persist(
        (set) => ({
            notices: [
                {
                    id: '1',
                    title: '시스템 점검 안내',
                    content: '이번 주 일요일 새벽 2시부터 4시까지 시스템 점검이 있을 예정입니다.',
                    authorId: 'admin',
                    authorName: '관리자',
                    targetType: 'ALL',
                    isImportant: true,
                    createdAt: new Date(),
                },
            ],
            addNotice: (notice) =>
                set((state) => ({
                    notices: [
                        {
                            ...notice,
                            id: Math.random().toString(36).substr(2, 9),
                            createdAt: new Date(),
                        },
                        ...state.notices,
                    ],
                })),
            deleteNotice: (id) =>
                set((state) => ({
                    notices: state.notices.filter((n) => n.id !== id),
                })),
            updateNotice: (id, updates) =>
                set((state) => ({
                    notices: state.notices.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                })),
        }),
        {
            name: 'notice-storage',
        }
    )
);
