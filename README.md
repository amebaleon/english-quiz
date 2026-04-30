# 영어 학원 실시간 퀴즈 플랫폼

> 선생님이 세션을 열면 학생들이 스마트폰으로 실시간 퀴즈에 참여하는 영어 학원 전용 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)

---

## 주요 기능

### 선생님

| 기능 | 설명 |
|------|------|
| **학생 관리** | 이름·반·PIN 등록, 엑셀 일괄 업로드, 포인트 조정, 반별 관리 |
| **퀴즈 제작** | 객관식(2~N선지)·주관식 문제 추가, 선지 드래그 재정렬, 엑셀 업로드 |
| **세션 진행** | 6자리 코드 + QR코드 생성, 문제별 진행·건너뛰기·정답 공개 |
| **결과 분석** | 세션별 참가자 정답률·점수 조회, 실시간 랭킹, 엑셀 다운로드 |
| **대시보드** | 전체 통계, 최근 세션 목록 및 상세 결과 |

### 학생

| 기능 | 설명 |
|------|------|
| **PIN 로그인** | 이름 + 4자리 PIN (5회 실패 시 15분 잠금) |
| **세션 입장** | 6자리 코드 직접 입력 또는 QR코드 스캔 |
| **실시간 퀴즈** | 문제 수신·답변 제출·정답 즉시 확인·포인트 획득 애니메이션 |
| **프로필** | 누적 포인트, 반 랭킹, PIN 직접 변경 |

---

## 기술 스택

```
Frontend   Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript 5
Backend    Next.js API Routes · Supabase (PostgreSQL + Realtime)
인증       Supabase Auth (선생님) · httpOnly 쿠키 + bcrypt PIN (학생)
기타       xlsx (엑셀) · next-pwa (PWA) · Vercel (배포 + Cron)
```

---

## 프로젝트 구조

```
quiz-app/
├── app/
│   ├── page.tsx                        # 랜딩 페이지 (선생님/학생 선택)
│   ├── (teacher)/teacher/
│   │   ├── page.tsx                    # 대시보드
│   │   ├── DashboardClient.tsx
│   │   ├── students/                   # 학생 관리
│   │   ├── quizzes/                    # 퀴즈 관리
│   │   ├── session/                    # 세션 진행
│   │   └── help/                       # 도움말
│   ├── (student)/student/
│   │   ├── login/                      # 학생 로그인 (이름 + PIN)
│   │   ├── home/                       # 홈 (포인트·랭킹)
│   │   ├── join/                       # 세션 입장 코드 입력
│   │   ├── quiz/                       # 퀴즈 진행 (실시간)
│   │   └── profile/                    # 포인트 이력 · PIN 변경
│   └── api/
│       ├── teacher/                    # 선생님 API (Supabase Auth 필요)
│       │   ├── students/
│       │   ├── quizzes/[id]/import     # 엑셀 임포트
│       │   ├── sessions/[id]/ranking   # 실시간 랭킹
│       │   └── points/
│       ├── student/                    # 학생 API (쿠키 인증)
│       │   ├── login · logout
│       │   ├── quiz · answer · results
│       │   └── profile · pin
│       └── ping/                       # Supabase keepalive (Cron)
├── components/
│   ├── ui/
│   │   ├── Icon.tsx                    # SVG 아이콘 컴포넌트
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   └── teacher/
│       ├── TeacherSidebar.tsx
│       └── quizzes/QuestionForm.tsx    # 가변 선지 문제 편집 폼
└── lib/
    ├── api/auth.ts                     # assertTeacher · handleApiError
    ├── constants.ts                    # 세션 상태 라벨·색상
    ├── types/database.ts
    ├── supabase/                       # client · server
    └── utils/pin.ts                    # hashPin · verifyPin (bcrypt)
```

---

## 세션 흐름

```
          선생님                              학생
            │                                  │
  [퀴즈 선택 → 세션 시작]                       │
            │                                  │
     waiting ──────── 코드/QR 공유 ──────► 입장 대기
            │                                  │
  [퀴즈 시작 버튼]                               │
            │                                  │
      active ◄──── Realtime ────────────► 문제 화면
            │                                  │
            │ ◄─────────────────── 답변 제출    │
            │                                  │
  [정답 공개 버튼]                               │
            │                                  │
    revealed ◄──── Realtime ────────────► 결과 화면
   (포인트 자동 지급)                      (정답/오답 표시)
            │                                  │
  [다음 문제] ──────── 반복 ──────────────► 다음 문제
            │                                  │
    finished ◄──── Realtime ────────────► 최종 순위
```

---

## 엑셀 업로드 형식

### 퀴즈 문제 (`.xlsx`)

**B열(선지수)에 따라 3가지 방식을 지원합니다.**

#### 방식 1 — B열에 선지수 명시

| A열 | B열 | C열~ | 정답열 | 포인트열 |
|-----|-----|------|--------|----------|
| 문제 내용 | 선지수 (`1`=주관식, `2`이상=N선지) | 선지1, 선지2, ... | 정답 번호(1부터) 또는 정답 텍스트 | 포인트 (생략 시 10) |

```
# 주관식 (B=1)
apple의 뜻은? | 1 | 사과 | 10

# 2선지 객관식 (B=2)
O/X 문제입니다 | 2 | O | X | 1 | 10

# 4선지 객관식 (B=4)
사과의 영어는? | 4 | apple | banana | cherry | grape | 1 | 10
```

#### 방식 2 — B열 비워서 자동인식

B열을 비우면 **마지막 2열(정답, 포인트)을 제외**한 나머지를 선지로 자동 인식합니다.  
선지가 0개면 주관식, 1개 이상이면 객관식으로 처리됩니다.

```
# 자동 주관식 (선지 0개)
apple의 뜻은? | (빈칸) | 사과 | 10

# 자동 3선지 객관식 (선지 3개)
수도는? | (빈칸) | 서울 | 도쿄 | 베이징 | 1 | 10
```

> 기존 A~G열 고정 형식(B~E에 4개 선지)도 자동인식 모드로 그대로 동작합니다.

---

### 학생 명단 (`.xlsx` 또는 CSV)

| A열 | B열 | C열 |
|-----|-----|-----|
| 이름 | PIN (4~6자리) | 반 이름 (선택) |

```
홍길동,1234,3학년A반
이순신,5678,3학년B반
강감찬,0000
```

---

## 로컬 개발 환경

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 내용을 채워주세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. 개발 서버 실행

```bash
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run start    # 빌드 후 실행
```

---

## 배포

Vercel에 연결 후 환경 변수 3개를 동일하게 설정하면 됩니다.  
`vercel.json`에 Cron Job이 등록되어 있어 **5일마다 Supabase를 자동으로 ping** — 무료 플랜 일시정지를 방지합니다.

```json
{ "crons": [{ "path": "/api/ping", "schedule": "0 0 */5 * *" }] }
```

---

## 데이터 관리 정책

- 학생 1인당 **답변 최대 100개**, 초과 시 오래된 것부터 자동 삭제
- 학생 1인당 **포인트 기록 최대 200개** 보관
- 답변 내용 최대 **300자**
- 오래된 `waiting` 상태 세션은 대시보드 접속 시 자동 정리

---

## 보안

- 선생님: Supabase Auth 세션 기반 인증
- 학생: `httpOnly` 쿠키 + bcrypt PIN 해시 (7일 유지)
- PIN 5회 오류 시 15분 잠금
- 모든 teacher API는 서버에서 인증 검증 (`assertTeacher`)
- 학생 퀴즈 API는 정답을 `revealed` 상태일 때만 응답에 포함
