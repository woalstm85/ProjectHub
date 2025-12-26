# 프로젝트 관리 시스템

React + TypeScript 기반의 전문적인 프로젝트 관리 시스템입니다.

## 🚀 빠른 시작

### 1. 필수 패키지 설치
```bash
npm install dayjs zustand
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 로그인
브라우저에서 http://localhost:5173 접속 후 아래 계정으로 로그인:
- **관리자**: admin / admin123
- **사용자**: demo / demo123

## 🛠 기술 스택

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design 6
- **State Management**: Zustand (with persist)
- **Routing**: React Router v7
- **Date Library**: dayjs
- **Charts**: Recharts
- **Drag & Drop**: @hello-pangea/dnd

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── PrivateRoute.tsx
├── pages/              # 페이지 컴포넌트
│   ├── Login.tsx       # 로그인 페이지
│   ├── Dashboard.tsx   # 대시보드
│   ├── Projects.tsx    # 프로젝트 목록
│   ├── ProjectDetail.tsx # 프로젝트 상세
│   ├── Tasks.tsx       # 작업 관리
│   ├── Members.tsx     # 팀원 관리
│   └── Reports.tsx     # 보고서
├── layouts/            # 레이아웃 컴포넌트
│   └── MainLayout.tsx
├── store/              # Zustand 스토어
│   ├── authStore.ts    # 인증 상태
│   ├── projectStore.ts # 프로젝트 상태
│   ├── taskStore.ts    # 작업 상태
│   └── memberStore.ts  # 팀원 상태
├── types/              # TypeScript 타입 정의
│   ├── auth.ts
│   ├── project.ts
│   ├── task.ts
│   └── member.ts
├── utils/              # 유틸리티 함수
├── hooks/              # 커스텀 훅
└── services/           # API 서비스
```

## ✨ 주요 기능

### ✅ 구현 완료
- **로그인/인증 시스템**
  - 전문적인 로그인 UI
  - LocalStorage 기반 세션 유지
  - PrivateRoute 보호
  
- **대시보드**
  - 프로젝트 현황 통계
  - 작업 완료율
  - 실시간 지표 카드

- **프로젝트 관리**
  - CRUD 기능
  - 상태/우선순위/방법론 관리
  - 예산 및 일정 관리
  - **워터폴 단계별 진행 현황**
    - 요구사항 분석
    - 설계
    - 구현
    - 테스트
    - 배포

- **프로젝트 상세 페이지**
  - 주요 지표 (진행률, 예산, 시간, 팀원)
  - 워터폴 Timeline 시각화
  - 작업 현황 통계
  - 상세 정보 표시

- **팀원 관리**
  - 팀원 CRUD
  - 역할 관리

- **상태 관리**
  - Zustand 기반
  - 메모리 저장 (persist)

- **반응형 디자인**
  - 모바일/태블릿/데스크톱 지원

### 🔜 개발 예정
- ⬜ 칸반보드 (Drag & Drop)
- ⬜ 간트 차트
- ⬜ 작업 관리 상세
- ⬜ 보고서 및 통계 차트
- ⬜ 백엔드 API 연동
- ⬜ 파일 업로드
- ⬜ 댓글 시스템
- ⬜ 알림 기능

## 🎨 디자인 특징

- **전문적인 UI/UX**
  - 깔끔한 카드 기반 레이아웃
  - 일관된 색상 테마 (그라데이션)
  - 부드러운 애니메이션

- **색상 팔레트**
  - Primary: #667eea (보라-파랑 그라데이션)
  - Success: #52c41a
  - Warning: #faad14
  - Error: #ff4d4f

## 📊 지원하는 방법론

- **Waterfall (워터폴)**: 순차적 단계별 진행
- **Agile (애자일)**: 반복적 개발
- **Scrum (스크럼)**: 스프린트 기반
- **Kanban (칸반)**: 시각적 작업 흐름

## 🔐 인증 시스템

현재는 메모리 기반 인증을 사용하며, LocalStorage에 세션이 저장됩니다.

**데모 계정:**
```
관리자
ID: admin
PW: admin123

일반 사용자
ID: demo
PW: demo123
```

## 🚀 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물은 dist/ 폴더에 생성됩니다
```

## 📝 라이선스

MIT License

---

**Made with ❤️ using React + TypeScript + Ant Design**
