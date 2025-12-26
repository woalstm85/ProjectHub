// 팀원 역할
export enum MemberRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  QA = 'QA',
  ANALYST = 'ANALYST',
}

// 팀원 인터페이스
export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar?: string;
  department?: string;
  createdAt: Date;
}

// 팀원 생성 DTO
export interface CreateMemberDTO {
  name: string;
  email: string;
  role: MemberRole;
  department?: string;
}
