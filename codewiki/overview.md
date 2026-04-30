# 프로젝트 개요

## 기술 스택
- **프레임워크**: Next.js 16 (App Router), `proxy.ts` = middleware
- **UI**: React 19 + TypeScript + Tailwind CSS v4
- **DB/Auth**: Supabase (PostgreSQL + Realtime + Auth)
- **배포**: Vercel

## 역할 구조
| 역할 | 경로 | 인증 방식 |
|------|------|-----------|
| 선생님 | `/teacher/*` | Supabase Auth (이메일+비밀번호) |
| 학생 | `/student/*` | httpOnly 쿠키 `student_id` (7일) |

## 주요 흐름

### 퀴즈 세션 흐름
1. 선생님이 `/teacher/session`에서 퀴즈 선택 → 세션 생성 (6자리 코드)
2. 학생이 코드 입력 또는 QR 스캔 → `session_participants`에 등록
3. 선생님이 "퀴즈 시작" → `sessions.status = 'active'`, `current_question_index = 0`
4. 학생이 답변 제출 → `answers` 테이블에 저장
5. 선생님이 "정답 공개" → `status = 'revealed'`, 객관식 자동 채점+포인트 지급
6. 선생님이 "다음 문제" → `current_question_index++`
7. 마지막 문제 후 "다음" → `status = 'finished'`

### Realtime 구독
- **선생님**: `session_participants`(INSERT), `answers`(INSERT/UPDATE) 구독
- **학생**: `sessions`(UPDATE), `answers`(UPDATE) 구독
- **폴링 폴백**: 3초마다 fetch (Realtime 누락 대비)

## 파일 구조
```
app/
  (student)/student/    학생 페이지 (login, home, join, quiz, profile)
  (teacher)/teacher/    선생님 페이지 (대시보드, 퀴즈, 학생, 세션, 도움말)
  teacher/login/        선생님 로그인 (route group 밖)
  api/student/          학생 API
  api/teacher/          선생님 API
components/
  ui/                   Modal, Toast
  teacher/              TeacherSidebar, Tutorial, 각종 모달
lib/
  supabase/             client.ts, server.ts
  api/auth.ts           assertTeacher(), handleApiError()
  hooks/useToast.ts     toast 상태 관리
  utils/pin.ts          PIN 해시/생성
  constants.ts          세션 상태 레이블/색상
proxy.ts                인증 미들웨어 (선생님 Supabase, 학생 cookie)
codewiki/               프로젝트 문서 (이 폴더)
```
