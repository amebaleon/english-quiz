import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'

export async function POST(request: NextRequest) {
  try {
    const { studentId, pin } = await request.json()

    if (!studentId || !pin) {
      return NextResponse.json({ success: false, error: '학생 ID와 PIN을 입력하세요.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: student, error } = await supabase
      .from('users')
      .select('id, name, pin_hash, class_id')
      .eq('id', studentId)
      .eq('role', 'student')
      .single()

    if (error || !student) {
      return NextResponse.json({ success: false, error: '학생을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!student.pin_hash) {
      return NextResponse.json({ success: false, error: 'PIN이 설정되지 않았습니다. 선생님께 문의하세요.' }, { status: 400 })
    }

    const valid = await verifyPin(pin, student.pin_hash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'PIN이 올바르지 않습니다.' }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      data: { id: student.id, name: student.name, class_id: student.class_id },
    })

    // httpOnly 쿠키로 학생 ID 저장 (24시간)
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
