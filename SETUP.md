# 영어퀴즈 앱 — 처음부터 배포까지 가이드

아무것도 몰라도 이 순서대로 따라하면 됩니다.

---

## 1단계 — Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** → 구글 계정으로 로그인
2. **New project** 클릭
3. 프로젝트 이름: `english-quiz` (아무거나 가능)
4. Database Password: 비밀번호 입력 (저장해두세요)
5. Region: **Northeast Asia (Seoul)** 선택
6. **Create new project** 클릭 → 1~2분 대기

---

## 2단계 — 환경변수 키 복사하기

Supabase 프로젝트 생성 후:

1. 왼쪽 메뉴에서 **Settings** → **API** 클릭
2. 아래 3가지 값을 복사해서 `.env.local` 파일에 붙여넣기

```
# .env.local 파일을 열어서 아래처럼 수정
NEXT_PUBLIC_SUPABASE_URL=https://여기에URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ로시작하는긴키
SUPABASE_SERVICE_ROLE_KEY=eyJ로시작하는또다른긴키
```

> ⚠️ service_role 키는 절대 공개하면 안 됩니다!

---

## 3단계 — DB 테이블 만들기

1. Supabase 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. `supabase/schema.sql` 파일 전체 내용을 복사해서 붙여넣기
4. **Run** 버튼 클릭 (초록색)
5. "Success" 메시지 확인

---

## 4단계 — 선생님 계정 만들기

### 4-1. Supabase Auth에서 계정 생성
1. Supabase 왼쪽 메뉴 **Authentication** → **Users** 클릭
2. **Add user** → **Create new user**
3. Email: 선생님 이메일, Password: 비밀번호 입력
4. **Create user** 클릭
5. 생성된 유저의 **UUID** 복사 (예: `abc123...`)

### 4-2. users 테이블에 연결
SQL Editor에서 새 쿼리:

```sql
INSERT INTO public.users (name, role, auth_id)
VALUES ('선생님이름', 'teacher', '위에서복사한UUID');
```

**Run** 클릭

---

## 5단계 — 로컬에서 실행해보기

터미널(명령 프롬프트)을 열고:

```bash
# 프로젝트 폴더로 이동 (경로는 실제 위치에 맞게)
cd "C:\Users\windo\OneDrive\바탕 화면\godti"

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 열기

> 선생님 로그인 → `/teacher/login`
> 학생 로그인 → `/student/login`

---

## 6단계 — GitHub에 올리기 (Vercel 배포 전 필요)

1. https://github.com 계정 만들기 (있으면 생략)
2. **New repository** → 이름: `english-quiz` → **Create**
3. 터미널에서:

```bash
git init
git add .
git commit -m "영어퀴즈 앱 초기 버전"
git branch -M main
git remote add origin https://github.com/내아이디/english-quiz.git
git push -u origin main
```

> ⚠️ `.env.local` 은 `.gitignore`에 있어서 자동으로 제외됩니다 (키 안전)

---

## 7단계 — Vercel 배포

1. https://vercel.com → GitHub 계정으로 로그인
2. **Add New Project** → GitHub 저장소 선택
3. **Environment Variables** 섹션에서 `.env.local`의 키 3개 입력:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy** 클릭 → 2~3분 대기
5. 배포 완료 후 URL 확인 (예: `https://english-quiz-xxx.vercel.app`)

---

## 8단계 — Supabase에 배포 URL 등록

Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://english-quiz-xxx.vercel.app`
- **Redirect URLs**: `https://english-quiz-xxx.vercel.app/**`

**Save** 클릭

---

## 9단계 — 학생 PWA 설치 (홈화면 추가)

학생이 스마트폰에서:

1. Chrome 브라우저로 `https://앱주소/student/login` 접속
2. 브라우저 메뉴(⋮) → **홈 화면에 추가**
3. 이제 앱처럼 실행됩니다!

---

## 처음 사용 순서

```
선생님:
1. /teacher/login 로그인
2. /teacher/students 에서 학생 추가 (이름 + PIN)
3. /teacher/quizzes 에서 퀴즈 만들기
4. 수업 시작 → /teacher/session → 세션 시작 → 코드 공유

학생:
1. /student/login → 이름 선택 → PIN 입력
2. /student/join → 6자리 코드 입력
3. 문제 풀기!
```

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| 로그인이 안 돼요 | Supabase Auth 계정 + users 테이블 연결 확인 |
| DB 오류 | schema.sql 다시 실행 |
| 학생이 접속 못 해요 | 배포 URL이 Supabase URL Configuration에 등록됐는지 확인 |
| Realtime이 안 돼요 | Supabase → Realtime 탭 활성화 여부 확인 |
