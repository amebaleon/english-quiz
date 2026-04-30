# 엑셀 임포트 포맷

API 경로: `POST /api/teacher/quizzes/[id]/import`  
구현 파일: `app/api/teacher/quizzes/[id]/import/route.ts`

---

## 퀴즈 문제 임포트

### 열 구조

| 열 | 역할 | 값 |
|----|------|-----|
| A (0) | 문제 내용 | 텍스트 (필수) |
| B (1) | 선지수 | `1` = 주관식 · `N≥2` = N선지 객관식 · **빈칸** = 자동인식 |
| C~ | 선지 내용 | B열에 명시된 수만큼, 또는 자동인식 |
| 정답열 | 정답 | 객관식: 1-indexed 번호 · 주관식: 정답 텍스트 |
| 포인트열 | 포인트 | 숫자, 생략 시 기본값 10 |

---

### 파싱 로직

#### B열 명시 모드

```
B = "1"  →  주관식
  C = 정답 텍스트
  D = 포인트 (없으면 10)

B = "N" (N≥2)  →  N선지 객관식
  C~(C+N-1) = 선지 1~N
  C+N        = 정답 번호 (1 이상 N 이하)
  C+N+1      = 포인트 (없으면 10)
```

#### 자동인식 모드 (B열 비어있음)

```
col(2)부터 끝까지 비어있지 않은 값 수집 → tail[]
tail 길이 < 2 → 오류

points  = tail[마지막]       (숫자여야 함)
answer  = tail[끝에서 두 번째]
options = tail[0 .. 끝에서 셋째]

options.length === 0  →  주관식 (answer = 정답 텍스트)
options.length >= 1   →  객관식 (answer = 1-indexed 번호)
```

---

### 예시

#### B열 명시 — 주관식

| A | B | C | D |
|---|---|---|---|
| apple의 뜻은? | 1 | 사과 | 10 |
| dog의 뜻은? | 1 | 개 | 5 |

→ `{ type:'short', content:'apple의 뜻은?', options:null, answer:'사과', points:10 }`

#### B열 명시 — 3선지 객관식

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| 수도는? | 3 | 서울 | 도쿄 | 베이징 | 1 | 10 |

→ `{ type:'multiple', options:['서울','도쿄','베이징'], answer:'0', points:10 }`

#### 자동인식 — 주관식

| A | B | C | D |
|---|---|---|---|
| apple의 뜻은? | (빈칸) | 사과 | 10 |

→ tail = ['사과','10'], options=[], 주관식  
→ `{ type:'short', answer:'사과', points:10 }`

#### 자동인식 — 4선지 객관식 (기존 포맷 호환)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 사과의 영어는? | (빈칸) | apple | banana | cherry | grape | 1 | 10 |

→ tail = ['apple','banana','cherry','grape','1','10']  
→ options=['apple','banana','cherry','grape'], answer=1(→0-indexed: 0), points=10

---

### DB 저장 구조

```ts
// questions 테이블
{
  quiz_id:     string
  type:        'multiple' | 'short'
  content:     string
  options:     string[] | null   // JSONB — 선지 수 제한 없음
  answer:      string            // 객관식: '0'-indexed 문자열 · 주관식: 정답 텍스트
  points:      number
  order_index: number
}
```

---

## 학생 명단 임포트

API 경로: `POST /api/teacher/students/bulk`

| 열 | 내용 | 비고 |
|----|------|------|
| A | 이름 | 필수 |
| B | PIN | 4~6자리 숫자 |
| C | 반 이름 | 선택, 없으면 null, 새 이름이면 자동 생성 |

최대 200명 일괄 등록. 중복 이름은 오류 처리.
