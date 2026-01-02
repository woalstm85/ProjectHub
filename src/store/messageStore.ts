import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MessageType = 'DIRECT' | 'CHANNEL' | 'SYSTEM';

export interface Message {
    id: string;
    type: MessageType;
    senderId: string;
    senderName: string;
    receiverId?: string; // For DIRECT
    receiverName?: string; // For DIRECT
    projectId?: string; // For CHANNEL
    content: string;
    isRead?: boolean; // For DIRECT
    createdAt: Date;
    metadata?: {
        issueId?: string;
        taskId?: string;
        isUrgent?: boolean;
        templateId?: string;
    };
}

interface MessageStore {
    messages: Message[];
    sendMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    deleteMessage: (id: string) => void;
    clearChannelMessages: (projectId: string) => void;
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
                            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
            clearChannelMessages: (projectId) =>
                set((state) => ({
                    messages: state.messages.filter((m) => m.projectId !== projectId),
                })),
        }),
        {
            name: 'message-storage',
        }
    )
);
