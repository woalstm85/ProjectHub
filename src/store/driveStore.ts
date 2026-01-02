import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DriveItemType = 'FILE' | 'FOLDER';

export interface DriveItem {
    id: string;
    name: string;
    type: DriveItemType;
    parentId: string | null;
    size: number; // bytes
    format?: string; // e.g., 'pdf', 'jpg', 'docx'
    ownerId: string;
    ownerName: string;
    createdAt: Date;
    updatedAt: Date;
}

interface DriveStore {
    items: DriveItem[];
    createFolder: (name: string, parentId: string | null) => void;
    uploadFile: (file: File, parentId: string | null) => void; // Mock upload
    deleteItem: (id: string) => void;
    renameItem: (id: string, newName: string) => void;
    getItemsByParentId: (parentId: string | null) => DriveItem[];
}

export const useDriveStore = create<DriveStore>()(
    persist(
        (set, get) => ({
            items: [
                // Root Folders
                {
                    id: 'folder-1',
                    name: '📁 프로젝트 산출물',
                    type: 'FOLDER',
                    parentId: null,
                    size: 0,
                    ownerId: 'admin',
                    ownerName: '관리자',
                    createdAt: new Date(Date.now() - 86400000 * 10),
                    updatedAt: new Date(Date.now() - 86400000 * 10),
                },
                {
                    id: 'folder-2',
                    name: '🎨 디자인 리소스',
                    type: 'FOLDER',
                    parentId: null,
                    size: 0,
                    ownerId: 'user-2',
                    ownerName: '김철수',
                    createdAt: new Date(Date.now() - 86400000 * 5),
                    updatedAt: new Date(Date.now() - 86400000 * 5),
                },
                {
                    id: 'folder-3',
                    name: '📑 회의록 및 보고서',
                    type: 'FOLDER',
                    parentId: null,
                    size: 0,
                    ownerId: 'admin',
                    ownerName: '관리자',
                    createdAt: new Date(Date.now() - 86400000 * 20),
                    updatedAt: new Date(Date.now() - 86400000 * 20),
                },
                // Files in '프로젝트 산출물'
                {
                    id: 'file-1',
                    name: '최종_요구사항_명세서_v1.0.pdf',
                    type: 'FILE',
                    parentId: 'folder-1',
                    size: 2500000, // 2.5MB
                    format: 'pdf',
                    ownerId: 'user-3',
                    ownerName: '이영희',
                    createdAt: new Date(Date.now() - 86400000 * 8),
                    updatedAt: new Date(Date.now() - 86400000 * 8),
                },
                {
                    id: 'file-2',
                    name: '시스템_아키텍처_다이어그램.png',
                    type: 'FILE',
                    parentId: 'folder-1',
                    size: 1024000, // 1MB
                    format: 'png',
                    ownerId: 'user-2',
                    ownerName: '김철수',
                    createdAt: new Date(Date.now() - 86400000 * 7),
                    updatedAt: new Date(Date.now() - 86400000 * 7),
                },
            ],
            createFolder: (name, parentId) =>
                set((state) => ({
                    items: [
                        ...state.items,
                        {
                            id: `folder-${Date.now()}`,
                            name: name,
                            type: 'FOLDER',
                            parentId: parentId,
                            size: 0,
                            ownerId: 'current-user', // Should be dynamic
                            ownerName: '나',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ],
                })),
            uploadFile: (file, parentId) =>
                set((state) => ({
                    items: [
                        ...state.items,
                        {
                            id: `file-${Date.now()}`,
                            name: file.name,
                            type: 'FILE',
                            parentId: parentId,
                            size: file.size,
                            format: file.name.split('.').pop() || 'file',
                            ownerId: 'current-user',
                            ownerName: '나',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ],
                })),
            deleteItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id && item.parentId !== id),
                })),
            renameItem: (id, newName) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, name: newName, updatedAt: new Date() } : item
                    ),
                })),
            getItemsByParentId: (parentId) => {
                return get().items.filter(item => item.parentId === parentId);
            }
        }),
        {
            name: 'drive-storage',
        }
    )
);
