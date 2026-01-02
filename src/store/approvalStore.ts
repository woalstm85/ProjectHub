import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalType = 'ISSUE_RESOLUTION' | 'BUDGET' | 'QUALITY_CHECK' | 'RELEASE' | 'GENERAL';
export type ApprovalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Approval {
    id: string;
    title: string;
    type: ApprovalType;
    priority: ApprovalPriority;
    status: ApprovalStatus;
    requesterId: string;
    requesterName: string;
    approverId: string;
    approverName: string;
    projectId: string;
    projectName: string;
    relatedEntityId?: string;
    content: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ApprovalStore {
    approvals: Approval[];
    requestApproval: (approval: Omit<Approval, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
    processApproval: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void;
    cancelApproval: (id: string) => void;
    deleteApproval: (id: string) => void;
}

export const useApprovalStore = create<ApprovalStore>()(
    persist(
        (set) => ({
            approvals: [
                {
                    id: 'app-1',
                    title: 'ERP 시스템 로그인 보안 패치 운영 배포 승인',
                    type: 'RELEASE',
                    priority: 'HIGH',
                    status: 'PENDING',
                    requesterId: 'user-2',
                    requesterName: '김철수',
                    approverId: 'user-1',
                    approverName: '관리자',
                    projectId: 'proj-1',
                    projectName: 'ERP 시스템 고도화',
                    relatedEntityId: 'issue-1',
                    content: '로그인 보안 취약점 개선을 위한 패치 작업이 완료되었습니다. 검증 서버 테스트 결과 이상 없으며, 운영 서버 배포를 승인 요청합니다.',
                    createdAt: new Date(Date.now() - 3600000 * 2),
                    updatedAt: new Date(Date.now() - 3600000 * 2),
                },
                {
                    id: 'app-2',
                    title: '사출 성형기 B-22 정밀 안전 진단 결과 보고 및 가동 승인',
                    type: 'QUALITY_CHECK',
                    priority: 'URGENT',
                    status: 'PENDING',
                    requesterId: 'user-3',
                    requesterName: '박지민',
                    approverId: 'user-1',
                    approverName: '관리자',
                    projectId: 'proj-2',
                    projectName: '스마트 팩토리 도입',
                    content: '정기 점검 결과 주요 부품 교체가 완료되었습니다. 안전 센서 정상 작동 확인하였으며 재가동 승인 바랍니다.',
                    createdAt: new Date(Date.now() - 3600000 * 5),
                    updatedAt: new Date(Date.now() - 3600000 * 5),
                },
                {
                    id: 'app-3',
                    title: '신규 서버 인프라 확충 예산 집행 승인',
                    type: 'BUDGET',
                    priority: 'MEDIUM',
                    status: 'APPROVED',
                    requesterId: 'user-1',
                    requesterName: '관리자',
                    approverId: 'user-2',
                    approverName: '김철수',
                    projectId: 'proj-1',
                    projectName: 'ERP 시스템 고도화',
                    content: '사용자 증가에 따른 서버 부하 분산을 위해 클라우드 리소스 추가 배정 예산 승인을 요청합니다.',
                    createdAt: new Date(Date.now() - 86400000),
                    updatedAt: new Date(Date.now() - 86400000 + 3600000),
                }
            ],
            requestApproval: (approval) =>
                set((state) => ({
                    approvals: [
                        {
                            ...approval,
                            id: `app-${Date.now()}`,
                            status: 'PENDING',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        ...state.approvals,
                    ],
                })),
            processApproval: (id, status, reason) =>
                set((state) => ({
                    approvals: state.approvals.map((a) =>
                        a.id === id ? { ...a, status, rejectionReason: reason, updatedAt: new Date() } : a
                    ),
                })),
            cancelApproval: (id) =>
                set((state) => ({
                    approvals: state.approvals.map((a) =>
                        a.id === id ? { ...a, status: 'CANCELLED', updatedAt: new Date() } : a
                    ),
                })),
            deleteApproval: (id) =>
                set((state) => ({
                    approvals: state.approvals.filter((a) => a.id !== id),
                })),
        }),
        {
            name: 'approval-storage',
        }
    )
);
