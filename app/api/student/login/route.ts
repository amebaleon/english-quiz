import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'

export async function POST(request: NextRequest) {
  try {
    const { studentId, pin } = await request.json()

    if (!studentId || !pin) {
      return NextResponse.json({ success: false, error: '학생 ID와 PIN을 입력하세요.' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: student, error } = await service
      .from('users')
      .select('id, name, pin_hash, class_id, failed_attempts, locked_until')
      .eq('id', studentId)
      .eq('role', 'student')
      .single()

    if (error || !student) {
      return NextResponse.json({ success: false, error: '학생을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!student.pin_hash) {
      return NextResponse.json({ success: false, error: 'PIN이 설정되지 않았습니다. 선생님께 문의하세요.' }, { status: 400 })
    }

    // 잠금 확인
    if (student.locked_until && new Date(student.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(student.locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json({ success: false, error: `PIN 5회 오류로 ${remaining}분간 잠겼습니다. 선생님께 문의하세요.` }, { status: 429 })
    }

    const valid = await verifyPin(pin, student.pin_hash)

    if (!valid) {
      const attempts = (student.failed_attempts ?? 0) + 1
      const lockout = attempts >= 5
      await service.from('users').update({
        failed_attempts: lockout ? 0 : attempts,
        locked_until: lockout ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
      }).eq('id', studentId)

      const msg = lockout
        ? 'PIN 5회 오류로 15분간 잠겼습니다. 선생님께 문의하세요.'
        : `PIN이 올바르지 않습니다. (${attempts}/5)`
      return NextResponse.json({ success: false, error: msg }, { status: 401 })
    }

    // 로그인 성공 — 실패 기록 초기화
    await service.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', studentId)

    const response = NextResponse.json({
      success: true,
      data: { id: student.id, name: student.name, class_id: student.class_id },
    })

    response.cookies.set('student_id', student.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
