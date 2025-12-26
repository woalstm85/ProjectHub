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

// 회원가입 DTO
export interface RegisterDTO {
  username: string;
  password: string;
  name: string;
  email: string;
}
