import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPin, hashPin } from '@/lib/utils/pin'

export async function PATCH(request: NextRequest) {
  try {
    const studentId = request.cookies.get('student_id')?.value
    if (!studentId) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { currentPin, newPin } = await request.json()
    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, error: '현재 PIN과 새 PIN을 입력하세요.' }, { status: 400 })
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      return NextResponse.json({ success: false, error: 'PIN은 4~6자리 숫자여야 합니다.' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: student } = await service
      .from('users')
      .select('id, pin_hash')
      .eq('id', studentId)
      .eq('role', 'student')
      .single()

    if (!student) {
      return NextResponse.json({ success: false, error: '학생 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const valid = await verifyPin(currentPin, student.pin_hash)
    if (!valid) {
      return NextResponse.json({ success: false, error: '현재 PIN이 올바르지 않습니다.' }, { status: 401 })
    }

    const newHash = await hashPin(newPin)
    await service.from('users').update({ pin_hash: newHash }).eq('id', studentId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
