import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPin } from '@/lib/utils/pin'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 학생 목록 조회
export async function GET() {
  try {
    await assertTeacher()
    const service = createServiceClient()
    const { data, error } = await service
      .from('users')
      .select('id, name, class_id, total_points, birth_year, school, created_at, classes(id, name)')
      .eq('role', 'student')
      .order('name')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}

// 학생 추가
export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { name, pin, class_id, birth_year, school } = await request.json()

    if (!name?.trim()) return NextResponse.json({ success: false, error: '이름을 입력하세요.' }, { status: 400 })
    if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ success: false, error: 'PIN은 4자리 숫자여야 합니다.' }, { status: 400 })

    const pin_hash = await hashPin(pin)
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        role: 'student',
        pin_hash,
        class_id: class_id || null,
        birth_year: birth_year ? Number(birth_year) : null,
        school: school?.trim() || null,
      })
      .select('id, name, class_id, total_points, birth_year, school')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}
