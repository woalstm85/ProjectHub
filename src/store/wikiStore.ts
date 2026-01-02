import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WikiCategory = 'GENERAL' | 'TECHNICAL' | 'PROCESS' | 'ONBOARDING';

export interface WikiPage {
    id: string;
    title: string;
    content: string;
    parentId: string | null; // For hierarchy (future use)
    category: WikiCategory;
    authorId: string;
    authorName: string;
    createdAt: Date;
    updatedAt: Date;
}

interface WikiStore {
    pages: WikiPage[];
    addPage: (page: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePage: (id: string, updates: Partial<WikiPage>) => void;
    deletePage: (id: string) => void;
    getPageById: (id: string) => WikiPage | undefined;
}

export const useWikiStore = create<WikiStore>()(
    persist(
        (set, get) => ({
            pages: [
                {
                    id: 'wiki-1',
                    title: '👋 신규 입사자 온보딩 가이드',
                    content: `# 환영합니다! \n\n우리 팀에 합류하신 것을 진심으로 환영합니다. 이 문서는 여러분이 빠르게 적응할 수 있도록 돕기 위해 작성되었습니다.\n\n## 1. 첫 날 체크리스트\n- [ ] 사내 메신저 가입\n- [ ] 개발 환경 설정\n- [ ] 팀원들과 인사 나누기\n\n## 2. 주요 연락처\n- 인사팀: hr@company.com\n- IT지원: help@company.com`,
                    parentId: null,
                    category: 'ONBOARDING',
                    authorId: 'admin',
                    authorName: '관리자',
                    createdAt: new Date(Date.now() - 86400000 * 7),
                    updatedAt: new Date(Date.now() - 86400000 * 7),
                },
                {
                    id: 'wiki-2',
                    title: '💻 프론트엔드 개발 코딩 컨벤션',
                    content: `# 개발 컨벤션\n\n일관된 코드 품질을 유지하기 위한 우리의 규칙입니다.\n\n## Naming Convention\n- **Variables**: camelCase\n- **Components**: PascalCase\n- **Constants**: UPPER_SNAKE_CASE\n\n## Git Flow\n1. feature 브랜치 생성\n2. 작업 후 PR 생성\n3. 코드 리뷰 후 Merge`,
                    parentId: null,
                    category: 'TECHNICAL',
                    authorId: 'user-2',
                    authorName: '김철수',
                    createdAt: new Date(Date.now() - 86400000 * 30),
                    updatedAt: new Date(Date.now() - 86400000 * 2),
                },
                {
                    id: 'wiki-3',
                    title: '🚀 배포 프로세스 및 체크리스트',
                    content: `# 배포 가이드\n\n안전한 배포를 위해 아래 절차를 반드시 준수해주세요.\n\n### Pre-Deployment\n- [ ] 모든 테스트 통과 확인\n- [ ] 릴리즈 노트 작성\n\n### Deployment\n- [ ] Staging 배포 및 검증\n- [ ] Production 배포\n\n### Post-Deployment\n- [ ] 모니터링 대시보드 확인`,
                    parentId: null,
                    category: 'PROCESS',
                    authorId: 'user-3',
                    authorName: '이영희',
                    createdAt: new Date(Date.now() - 86400000 * 15),
                    updatedAt: new Date(Date.now() - 86400000 * 15),
                },
            ],
            addPage: (page) =>
                set((state) => ({
                    pages: [
                        {
                            ...page,
                            id: `wiki-${Date.now()}`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        ...state.pages,
                    ],
                })),
            updatePage: (id, updates) =>
                set((state) => ({
                    pages: state.pages.map((p) =>
                        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
                    ),
                })),
            deletePage: (id) =>
                set((state) => ({
                    pages: state.pages.filter((p) => p.id !== id),
                })),
            getPageById: (id) => get().pages.find((p) => p.id === id),
        }),
        {
            name: 'wiki-storage',
        }
    )
);
