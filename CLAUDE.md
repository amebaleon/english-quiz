@AGENTS.md

## 코드 문서화 규칙

코드를 수정하거나 추가할 때마다 반드시 `/codewiki` 폴더를 유지하고 업데이트해야 한다.

### codewiki 폴더 구조
```
codewiki/
  overview.md          # 프로젝트 전체 구조, 기술 스택, 주요 흐름
  api.md               # 모든 API 라우트 목록, 파라미터, 응답 형식
  components.md        # 주요 컴포넌트 설명, props, 역할
  database.md          # DB 테이블 구조, 컬럼, 관계
  auth.md              # 인증 흐름 (선생님 Supabase Auth, 학생 cookie)
  changelog.md         # 변경 이력 (날짜, 변경 내용, 영향 범위)
```

### 업데이트 규칙
- 새 API 라우트 추가 → `api.md` 업데이트
- 새 컴포넌트 추가 → `components.md` 업데이트
- DB 스키마 변경 → `database.md` 업데이트
- 기능 추가/수정 → `changelog.md`에 항목 추가
- 인증 로직 변경 → `auth.md` 업데이트
- 프로젝트 구조 변경 → `overview.md` 업데이트

### 작성 기준
- 미래의 개발자(또는 Claude)가 코드를 읽지 않고도 기능을 이해할 수 있을 정도로 상세히 작성
- 파라미터 타입, 옵션 값, 에러 케이스 모두 포함
- 변경 이유(why)와 영향 범위(impact)를 반드시 기록
