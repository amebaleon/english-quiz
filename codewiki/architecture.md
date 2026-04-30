# 아키텍처 개요

## 전체 구조

```
브라우저 (선생님 PC)          스마트폰 (학생)
        │                          │
        ▼                          ▼
  Next.js App Router  ──────────────────
        │
  API Routes (서버)
        │
  Supabase (PostgreSQL + Realtime)
```

## 라우트 그룹

| 그룹 | 경로 | 인증 |
|------|------|------|
| `(teacher)` | `/teacher/*` | Supabase Auth (이메일/비밀번호) |
| `(student)` | `/student/*` | httpOnly 쿠키 `student_id` |
| `teacher/login` | `/teacher/login` | 없음 |
| `student/login` | `/student/login` | 없음 |

## 인증 흐름

### 선생님
- `createClient()` (서버) → `supabase.auth.getUser()`
- `assertTeacher()` (`lib/api/auth.ts`) — 모든 teacher API에서 호출
- 실패 시 `401` 반환

### 학생
- 로그인 시 `student_id` 쿠키 발급 (httpOnly, 7일)
- PIN은 bcrypt 해시로 저장 (`lib/utils/pin.ts`)
- 5회 실패 시 `locked_until` 컬럼으로 15분 잠금
- API에서 `cookies().get('student_id')`로 검증

## 실시간 통신

Supabase Realtime (postgres_changes)으로 구현합니다.

```
선생님이 sessions 테이블 업데이트
  → 학생 클라이언트가 UPDATE 이벤트 수신
  → loadQuizData() 재호출
```

폴링 보완: 3초마다 `setInterval`로 폴링 (Realtime 연결 불안정 대비)

## 주요 DB 테이블

```sql
users            -- 학생 (id, name, class_id, pin_hash, total_points, ...)
classes          -- 반 (id, teacher_id, name)
quizzes          -- 퀴즈 세트 (id, teacher_id, title, category)
questions        -- 문제 (id, quiz_id, type, content, options jsonb, answer, points, order_index)
sessions         -- 세션 (id, quiz_id, code, status, current_question_index)
session_participants -- 참가자 (session_id, student_id)
answers          -- 답변 (id, session_id, question_id, student_id, content, is_correct)
point_history    -- 포인트 이력 (student_id, delta, reason)
```

## 핵심 컴포넌트

| 파일 | 역할 |
|------|------|
| `components/teacher/TeacherSidebar.tsx` | 선생님 사이드바 (SVG 아이콘, 슬라이드인 애니메이션) |
| `components/teacher/quizzes/QuestionForm.tsx` | 문제 편집 폼 (가변 선지, 드래그 정렬) |
| `components/ui/Icon.tsx` | 전역 SVG 아이콘 컴포넌트 (Heroicons 기반) |
| `app/(teacher)/teacher/session/SessionClient.tsx` | 세션 진행 실시간 UI |
| `app/(student)/student/quiz/page.tsx` | 학생 퀴즈 참여 화면 (Realtime 구독) |

## CSS 애니메이션

`app/globals.css`에 정의된 커스텀 클래스:

| 클래스 | 용도 |
|--------|------|
| `animate-sidebar-in` | 사이드바 왼쪽 슬라이드인 |
| `animate-nav-item` | 네비 아이템 순차 등장 |
| `animate-page-enter` | 페이지 콘텐츠 전환 |
| `animate-fade-in` | 일반 페이드인 |
| `animate-bounce-in` | 정답 결과 팝 효과 |
| `animate-slide-up` | 아래에서 슬라이드업 |
| `animate-float-up` | 포인트 획득 float |
| `flash-correct` / `flash-wrong` | 정답/오답 배경 플래시 |
| `shake` | PIN 오류 흔들기 |
