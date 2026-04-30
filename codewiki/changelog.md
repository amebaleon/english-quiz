# 변경 이력

## 2026-04-30

### 퀴즈 카테고리 시스템
- `quizzes` 테이블에 `category text NOT NULL DEFAULT '기타'` 컬럼 추가 (수동 마이그레이션 필요)
- 퀴즈 생성 시 카테고리 선택 (사전 정의 칩 + 직접 입력)
- 퀴즈 목록에 카테고리 탭 필터 추가 (전체/문법/어휘/독해 등)
- 퀴즈 카드에 카테고리 색상 배지 표시

### 퀴즈 검색
- QuizzesClient에 텍스트 검색 인풋 추가
- 카테고리 탭 필터와 AND 조건으로 동작

### 학생 일괄 등록
- `POST /api/teacher/students/bulk` API 추가
- CSV/Excel 파일 업로드 또는 텍스트 붙여넣기 지원
- 형식: `이름,PIN,반(선택)`
- 반 이름 자동 생성 (없으면 새로 만듦)
- 최대 200명 한 번에 등록 가능
- `BulkImportModal` 컴포넌트 추가 (3단계: 입력 → 미리보기 → 완료)

### CLAUDE.md 업데이트
- codewiki 폴더 유지 규칙 추가

### UX 개선 (이전 커밋)
- 전역 애니메이션: fade-in, bounce-in, slide-up
- Toast 슬라이드업 + 아이콘
- 학생 퀴즈 정답 시 bounce-in 애니메이션
- 선생님 세션 키보드 단축키 (Space/→)
- 답변 제출 진행바
- 학생 홈 페이지 그라디언트 헤더

### 참가자 목록 수정
- `loadParticipants` anon 클라이언트 → service role API 라우트로 변경
- `GET /api/teacher/sessions/[id]/participants` 신규 추가

### QR 코드 수정
- `window.location.origin` SSR 이슈 수정 (useState+useEffect 패턴)
- QR에 절대 URL 삽입되도록 수정

### 로그인 자동 리다이렉트
- 루트 페이지 서버 컴포넌트에서 auth 확인 후 자동 이동
- 선생님/학생 로그인 페이지 이미 로그인 시 홈으로 리다이렉트
