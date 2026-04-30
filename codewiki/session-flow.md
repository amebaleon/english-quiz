# 세션 상태 흐름

## 세션 상태 (status)

```
waiting  →  active  →  revealed  →  active  →  ...  →  finished
```

| 상태 | 의미 | 가능한 전환 |
|------|------|------------|
| `waiting` | 학생 입장 대기 중 | `active` (퀴즈 시작) · `finished` (강제 종료) |
| `active` | 문제 진행 중 (답변 수신) | `revealed` (정답 공개) · `finished` (강제 종료) |
| `revealed` | 정답 공개됨 (채점 완료) | `active` (다음 문제) · `finished` (세션 종료) |
| `finished` | 세션 종료 | — |

## 선생님 화면 액션

```
waiting  상태
  └─ [퀴즈 시작!] → status='active', current_question_index=0

active 상태
  ├─ [정답 공개] → status='revealed', 객관식 자동 채점 실행
  ├─ [건너뛰기]  → status='active', current_question_index++
  └─ [세션 종료] → status='finished'

revealed 상태
  ├─ [다음 문제] → status='active', current_question_index++
  ├─ [주관식 O/X 채점] → answers.is_correct 업데이트, 포인트 지급
  └─ [세션 종료] → status='finished'
```

## 학생 화면 분기

```
session.status = 'waiting'   → 대기 화면 (ping 애니메이션)
session.status = 'active'
  ├─ question 있음 + 미제출  → 문제 화면 (선지 or 주관식 입력)
  ├─ question 있음 + 제출완료 → 제출 완료 대기 화면
  └─ question 없음           → 다음 문제 대기 화면
session.status = 'revealed'  → 정답 확인 화면 (정답/오답/채점중/미제출)
session.status = 'finished'  → 최종 순위 화면
```

## 포인트 지급 시점

- **객관식**: `revealed` 전환 시 서버에서 자동 일괄 지급
  - `answers.is_correct = true`인 행의 `questions.points`를 합산
  - `users.total_points` 업데이트 + `point_history` 삽입
- **주관식**: 선생님이 수동으로 O 채점 시 즉시 지급
  - `PATCH /api/teacher/sessions/[id]/answers/[aid]` 호출

## 실시간 구독 (학생)

```ts
supabase
  .channel(`student-session:${sessionId}`)
  .on('postgres_changes', {
    event: 'UPDATE', table: 'sessions',
    filter: `id=eq.${sessionId}`
  }, () => loadQuizData())
  .on('postgres_changes', {
    event: 'UPDATE', table: 'answers',
    filter: `session_id=eq.${sessionId}`
  }, () => loadQuizData())
  .subscribe()
```

## 답변 현황 필터 탭 (선생님)

| 세션 상태 | 탭 목록 |
|-----------|---------|
| `active` | 제출 N명 / 미제출 N명 |
| `revealed` | 정답 N명 / 오답·채점중 N명 / 미제출 N명 |
