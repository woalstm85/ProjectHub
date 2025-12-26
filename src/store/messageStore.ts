import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
}

interface MessageStore {
    messages: Message[];
    sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    deleteMessage: (id: string) => void;
}

export const useMessageStore = create<MessageStore>()(
    persist(
        (set) => ({
            messages: [],
            sendMessage: (message) =>
                set((state) => ({
                    messages: [
                        {
                            ...message,
                            id: Math.random().toString(36).substr(2, 9),
                            isRead: false,
                            createdAt: new Date(),
                        },
                        ...state.messages,
                    ],
                })),
            markAsRead: (id) =>
                set((state) => ({
                    messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
                })),
            deleteMessage: (id) =>
                set((state) => ({
                    messages: state.messages.filter((m) => m.id !== id),
                })),
        }),
        {
            name: 'message-storage',
        }
    )
);
