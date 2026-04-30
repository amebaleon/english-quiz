# API 라우트 목록

## 학생 (Student) API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/student/login` | 이름+PIN으로 로그인, `student_id` httpOnly 쿠키 발급 (7일) | 없음 |
| POST | `/api/student/logout` | 쿠키 삭제 | cookie |
| GET | `/api/student/profile` | 내 이름, 포인트, 반 순위 조회 | cookie |
| POST | `/api/student/session` | 세션 코드로 입장, 참가자 등록 | cookie |
| GET | `/api/student/quiz?session_id=` | 현재 세션 상태+문제+내 답변 조회 | cookie |
| POST | `/api/student/answer` | 답변 제출 | cookie |
| GET | `/api/student/results?session_id=` | 세션 종료 후 전체 순위 조회 | cookie |
| GET | `/api/student/list` | 반별 학생 목록 (프로필용) | cookie |

## 선생님 (Teacher) API

### 학생 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/teacher/students` | 전체 학생 목록 |
| POST | `/api/teacher/students` | 학생 1명 추가 `{name, pin, class_id?}` |
| POST | `/api/teacher/students/bulk` | 학생 일괄 추가 `{students: [{name,pin,class_name?}]}` 최대 200명 |
| PATCH | `/api/teacher/students/[id]` | 이름/반 변경 |
| DELETE | `/api/teacher/students/[id]` | 학생 삭제 |
| GET | `/api/teacher/students/[id]/stats` | 학생 정답률/히스토리 |
| POST | `/api/teacher/students/[id]/pin` | PIN 초기화 |

### 반 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/teacher/classes` | 반 목록 |
| POST | `/api/teacher/classes` | 반 추가 `{name}` |
| DELETE | `/api/teacher/classes/[id]` | 반 삭제 |

### 퀴즈 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/teacher/quizzes` | 퀴즈 목록 (category 포함) |
| POST | `/api/teacher/quizzes` | 퀴즈 생성 `{title, category?}` |
| PATCH | `/api/teacher/quizzes/[id]` | 퀴즈 제목/카테고리 수정 |
| DELETE | `/api/teacher/quizzes/[id]` | 퀴즈 삭제 |
| POST | `/api/teacher/quizzes/[id]/duplicate` | 퀴즈 복제 |
| GET | `/api/teacher/quizzes/[id]/questions` | 문제 목록 |
| POST | `/api/teacher/quizzes/[id]/questions` | 문제 추가 |
| PATCH | `/api/teacher/quizzes/[id]/questions/[qid]` | 문제 수정 |
| DELETE | `/api/teacher/quizzes/[id]/questions/[qid]` | 문제 삭제 |

### 세션 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/teacher/sessions` | 진행 중 세션 조회 |
| POST | `/api/teacher/sessions` | 새 세션 생성 `{quiz_id}` |
| PATCH | `/api/teacher/sessions/[id]` | 세션 상태 변경 `{status, current_question_index}` |
| GET | `/api/teacher/sessions/[id]/participants` | 참가자 목록 (service role) |
| GET | `/api/teacher/sessions/[id]/answers?question_id=` | 답변 목록 |
| POST | `/api/teacher/sessions/[id]/award` | 객관식 정답 채점+포인트 지급 |
| POST | `/api/teacher/sessions/[id]/grade` | 주관식 수동 채점 |
| GET | `/api/teacher/sessions/[id]/detail` | 세션 상세 (대시보드용) |

### 포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/teacher/points/reset-class` | 반 전체 포인트 초기화 |
