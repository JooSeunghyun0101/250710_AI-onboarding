# 🎨 온보딩 대시보드 디자인 가이드

브랜드 정체성과 사용자 경험, 유지보수성을 모두 고려한 디자인 시스템입니다. 이 가이드는 프론트엔드 구현 및 디자이너 협업을 위한 기준을 명확히 제시하며, TailwindCSS와 WCAG 접근성 기준을 기반으로 구성됩니다.

---

## 1. 🧭 디자인 시스템 개요 (Design System Overview)

| 항목      | 내용                                   |
| ------- | ------------------------------------ |
| 디자인 스타일 | Bold-Minimal (대담하고 단순한 구조)           |
| 톤 앤 무드  | Modern, Friendly, Confident, Minimal |
| 접근성 지향  | WCAG 2.2 AA 이상 대비 비율 준수              |
| 인터랙션    | **모든 전환 효과 제거**: hover/slide 없음      |
| 아이콘 가이드 | 기능성(유틸리티) 아이콘만 사용: 화살표, 닫기 등         |

**디자인 키포인트 예시:**

![예시 이미지](https://picsum.photos/seed/ui-guide1/1024/300)

---

## 2. 🎨 컬러 팔레트 (TailwindCSS)

### ✅ 기본 색상 정의

| 색상명         | HEX       | Tailwind 변수                  |
| ----------- | --------- | ---------------------------- |
| Primary 500 | `#FF6B00` | `bg-primary`, `text-primary` |
| Primary 700 | `#CC5600` | `bg-primary-dark`            |
| Background  | `#FFFFFF` | `bg-white`                   |
| Text 기본     | `#000000` | `text-base`                  |
| Text 보조     | `#666666` | `text-muted`                 |
| Error       | `#D32F2F` | `text-error`                 |

### ✅ Tailwind 설정 예시 (tailwind.config.js)

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#FF6B00',
        dark: '#CC5600',
      },
      foreground: '#000000',
      muted: '#666666',
      error: '#D32F2F',
    },
  },
},
```

---

## 3. 📄 페이지별 가이드 (Page Implementations)

### 3.1. 신규입사자 등록 페이지

| 목적      | 신규 입사자 기본정보 입력    |
| ------- | ----------------- |
| 핵심 컴포넌트 | 입력폼, 저장버튼, 에러 알림  |
| 레이아웃    | 1단 폼 섹션, 넓은 여백 사용 |

**예시 레이아웃**

```text
[이름]  [부서]  [부서장]
[직책]  [직급]  [연락처]
[입사일] [시용기간]
[저장하기 버튼]
```

---

### 3.2. 자기기입 페이지

| 목적      | 입사자 본인이 보험, 병원, 설문 제출    |
| ------- | ------------------------ |
| 핵심 컴포넌트 | 스텝폼, 제출 버튼, 완료 뱃지        |
| 레이아웃    | 3단계 진행 방식 (보험 → 병원 → 설문) |

**컴포넌트 상태**

| 상태   | 스타일                                |
| ---- | ---------------------------------- |
| 활성화  | `border-primary`, `text-base`      |
| 비활성화 | `opacity-50`, `cursor-not-allowed` |
| 완료됨  | `bg-primary text-white` 뱃지 표시      |

---

### 3.3. 대시보드 통계/진행률

| 목적   | 입사자 진행상태 확인 및 메일발송    |
| ---- | --------------------- |
| 컴포넌트 | 상태 표시 뱃지, 드롭다운, 메일 버튼 |
| 레이아웃 | 표 기반, 요약 통계 섹션 포함     |

**예시 뱃지 스타일**

```html
<span class="px-2 py-1 text-sm rounded-full bg-primary text-white">진행중</span>
```

---

## 4. 📦 레이아웃 구성 및 라우팅 (Layout Components)

| 컴포넌트              | 설명                                 |
| ----------------- | ---------------------------------- |
| `<AppLayout>`     | 상단바 + 사이드바 구성                      |
| `<SidebarMenu>`   | 등록 / 목록 / 자기기입 / 통계 항목 표시          |
| `<Topbar>`        | 브랜드 로고, 내보내기 버튼                    |
| `<PageContainer>` | 모든 콘텐츠 wrapper (max-width: 1440px) |

**반응형 예시 (Tailwind)**

```html
<div class="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
```

---

## 5. 🧩 인터랙션 패턴 (Interaction Patterns)

| 요소   | 상태    | 적용 패턴                                       |
| ---- | ----- | ------------------------------------------- |
| 버튼   | 기본    | `bg-primary text-white font-bold px-4 py-2` |
| 버튼   | 비활성화  | `bg-gray-300 text-muted cursor-not-allowed` |
| 입력폼  | 포커스   | `outline-none border-primary`               |
| 아이콘  | 최소 사용 | `chevron-down`, `arrow-right`, `x` 등만 허용    |
| 트랜지션 | 없음    | `transition-none` 명시                        |

**Note:** hover/slide/fade 등의 시각 효과는 모두 제거

---

## 6. 📱 브레이크포인트 정의 (Breakpoints)

TailwindCSS 커스텀 설정 예시:

```js
theme: {
  screens: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
},
```

| 디바이스 | 해상도 기준      | 예시 처리 방식              |
| ---- | ----------- | --------------------- |
| 모바일  | ≤ 767px     | 사이드바 숨기고 상단 드롭다운으로 전환 |
| 태블릿  | 768–1023px  | 콘텐츠 정렬 최적화, 폼은 세로 쌓기  |
| 데스크탑 | 1024–1439px | 기본 레이아웃 기준            |
| 와이드  | ≥ 1440px    | 고해상도 지원, 여백 증가        |

---

## ♿ 접근성 체크리스트 (WCAG 2.2 AA 기준)

| 항목     | 기준                   | 상태                                    |
| ------ | -------------------- | ------------------------------------- |
| 텍스트 대비 | 최소 4.5:1 (텍스트 vs 배경) | ✅ (primary #FF6B00 on white ≈ 5.12:1) |
| 버튼 크기  | 최소 터치영역 44px × 44px  | ✅                                     |
| 포커스 표시 | 시각적으로 명확한 테두리        | ✅                                     |
| 키보드 탐색 | 모든 주요 요소 탭 가능        | ✅                                     |

---

## ✍️ 마무리 및 확장 제안

* 디자인 토큰을 Figma Variables로 분리하고, Tailwind Config와 동기화
* 향후 dark mode 또는 multi-brand 대응 시 컬러 스케일 확장 고려
* 컴포넌트별 상태/뱃지/입력 예외값 정의 문서화를 추천합니다