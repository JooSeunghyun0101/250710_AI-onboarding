# 🏢 HR 온보딩 시스템

신규 입사자 온보딩 과정을 자동화하는 웹 기반 대시보드 시스템입니다. 
HR팀의 반복적인 수작업을 디지털화하여 실수 없이 일관되고 자동화된 절차를 구현합니다.

## ✨ 주요 기능

### 👩‍💼 HR 담당자 기능
- **신규 입사자 등록**: 이름, 부서, 직급, 입사일 등 기본 정보 입력
- **온보딩 진행 상황 관리**: 입사자별 처리 현황 실시간 모니터링
- **자동 이메일 발송**: Make.com 연동을 통한 관련 부서 및 기관 자동 알림
- **데이터 내보내기**: 입사자 상태 CSV/PDF 다운로드
- **통계 대시보드**: 온보딩 현황 및 진행률 시각화

### 🙋‍♂️ 신규 입사자 기능
- **자기기입 정보 제출**: 보험 정보, 가족 사항 입력
- **건강검진 예약**: 병원 및 날짜 선택
- **온보딩 설문**: 피드백 및 개선사항 제출
- **진행률 확인**: 실시간 온보딩 진행 상황 확인

## 🛠 기술 스택

### Frontend
- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **Shadcn/ui** - 재사용 가능한 UI 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### Backend & Database
- **Supabase** - PostgreSQL 기반 BaaS
- **Row-level Security** - 데이터 보안
- **Real-time Subscriptions** - 실시간 데이터 동기화

### State Management & API
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **React Hook Form** - 폼 상태 관리
- **Zod** - 스키마 검증

### Automation & Integration
- **Make.com** - 이메일 자동화 및 워크플로우
- **Webhook** - 실시간 연동

### Utilities
- **date-fns** - 날짜/시간 처리
- **es-toolkit** - 유틸리티 함수
- **ts-pattern** - 패턴 매칭
- **react-use** - React 훅 컬렉션

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.17 이상
- npm, yarn, pnpm 또는 bun

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MAKE_WEBHOOK_URL=your_make_webhook_url
```

3. **개발 서버 실행**
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인할 수 있습니다.

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 코드 품질 검사
npm run lint
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 대시보드 페이지
│   │   ├── register/      # 신규 입사자 등록
│   │   ├── list/          # 입사자 목록 및 상세
│   │   ├── self-entry/    # 자기기입 양식
│   │   ├── stats/         # 통계 대시보드
│   │   └── export/        # 데이터 내보내기
│   └── globals.css        # 글로벌 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── dashboard/        # 대시보드 전용 컴포넌트
│   └── email-sender.tsx  # 이메일 발송 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── api.ts            # API 함수들
│   ├── logger.ts         # 로깅 시스템
│   ├── error-handler.ts  # 에러 처리
│   └── utils.ts          # 공통 유틸리티
├── types/                # 타입 정의
├── hooks/                # 커스텀 훅
└── constants/            # 상수 정의
```

## 🔐 보안 및 컴플라이언스

- **TLS 암호화**: 모든 데이터 전송 암호화
- **Row-level Security**: Supabase 기반 접근 제어
- **환경 변수**: 민감한 정보 안전한 관리
- **IP 제한**: VPN 또는 허용된 IP만 접속 가능
- **GDPR 준수**: 개인정보 보존 및 삭제 정책

## 📊 주요 성과 지표 (KPI)

- ✅ 온보딩 프로세스 실수 제거 (목표: 월 0건)
- ⏱️ 이메일 준비 시간 70% 단축
- 😀 입사자 만족도 90% 이상

## 🔗 외부 연동

### Make.com 워크플로우
- 입사자 정보 → 부서 알림 자동 발송
- 보험 정보 → 보험사 안내 메일 발송
- 건강검진 → 병원 예약 안내 발송
- 부서장 → 신규 입사자 정보 공유
- 시용 평가 → 3개월 후 자동 알림

## 🤝 기여 방법

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/새기능`)
3. 변경사항을 커밋합니다 (`git commit -am '새기능 추가'`)
4. 브랜치에 푸시합니다 (`git push origin feature/새기능`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원 및 문의

프로젝트 관련 문의사항이나 버그 리포트는 GitHub Issues를 통해 제출해주세요.
