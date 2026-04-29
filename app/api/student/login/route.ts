import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = await request.json()

    if (!name || !pin) {
      return NextResponse.json({ success: false, error: '이름과 PIN을 입력하세요.' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: students } = await service
      .from('users')
      .select('id, name, pin_hash, class_id, failed_attempts, locked_until')
      .ilike('name', name.trim())
      .eq('role', 'student')

    if (!students || students.length === 0) {
      return NextResponse.json({ success: false, error: '이름을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 동명이인 처리: PIN이 맞는 학생을 순서대로 찾음
    let matched = null
    for (const s of students) {
      if (s.locked_until && new Date(s.locked_until) > new Date()) continue
      if (!s.pin_hash) continue
      if (await verifyPin(pin, s.pin_hash)) { matched = s; break }
    }

    if (!matched) {
      // 잠기지 않은 첫 번째 학생에 실패 기록
      const target = students.find(s => !s.locked_until || new Date(s.locked_until) <= new Date())
      if (!target) {
        const remaining = Math.ceil((new Date(students[0].locked_until!).getTime() - Date.now()) / 60000)
        return NextResponse.json({ success: false, error: `PIN 5회 오류로 ${remaining}분간 잠겼습니다. 선생님께 문의하세요.` }, { status: 429 })
      }
      const attempts = (target.failed_attempts ?? 0) + 1
      const lockout = attempts >= 5
      await service.from('users').update({
        failed_attempts: lockout ? 0 : attempts,
        locked_until: lockout ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
      }).eq('id', target.id)
      const msg = lockout
        ? 'PIN 5회 오류로 15분간 잠겼습니다. 선생님께 문의하세요.'
        : `PIN이 올바르지 않습니다. (${attempts}/5)`
      return NextResponse.json({ success: false, error: msg }, { status: 401 })
    }

    // 로그인 성공 — 실패 기록 초기화
    await service.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', matched.id)

    const response = NextResponse.json({
      success: true,
      data: { id: matched.id, name: matched.name, class_id: matched.class_id },
    })

    response.cookies.set('student_id', matched.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
