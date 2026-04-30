# 인증 구조

## 선생님 인증

Supabase Auth (이메일/비밀번호) 기반입니다.

### 로그인 흐름

```
POST /teacher/login
  → supabase.auth.signInWithPassword({ email, password })
  → 성공 시 Supabase 세션 쿠키 자동 설정
  → router.push('/teacher')
```

### API 보호

모든 teacher API는 `assertTeacher()`를 호출합니다.

```ts
// lib/api/auth.ts
export async function assertTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, '인증 필요')
  return user
}
```

DB 작업이 필요한 경우 `createServiceClient()`로 RLS를 우회합니다.

---

## 학생 인증

이메일 없이 이름 + PIN만으로 로그인합니다.

### 로그인 흐름

```
POST /api/student/login
  Body: { name, pin }

1. users 테이블에서 name으로 검색
2. locked_until 확인 (잠금 여부)
3. verifyPin(pin, user.pin_hash) — bcryptjs compare
4. 실패: failed_attempts++, 5회 이상이면 locked_until = now + 15분
5. 성공: failed_attempts=0, 쿠키 발급
   Set-Cookie: student_id=<uuid>; HttpOnly; Path=/; Max-Age=604800
```

### PIN 해싱

```ts
// lib/utils/pin.ts
import bcrypt from 'bcryptjs'

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
```

### 학생 API 보호

```ts
const cookieStore = await cookies()
const studentId = cookieStore.get('student_id')?.value
if (!studentId) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
```

### PIN 변경 (학생 직접)

```
PATCH /api/student/pin
  Body: { currentPin, newPin }

1. 쿠키에서 student_id 확인
2. verifyPin(currentPin, 기존 hash)
3. 새 PIN 검증 (4~6자리 숫자)
4. hashPin(newPin) → users 테이블 업데이트
```

---

## 미들웨어 (proxy.ts)

Next.js 미들웨어에서 경로별 인증을 처리합니다.

- `/teacher/*` (login 제외): Supabase 세션 없으면 `/teacher/login` 리다이렉트
- `/student/*` (login, join 제외): `student_id` 쿠키 없으면 `/student/login` 리다이렉트
