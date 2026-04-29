import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hashPin } from '@/lib/utils/pin'

async function assertTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return supabase
}

// 학생 목록 조회
export async function GET() {
  try {
    await assertTeacher()
    const service = createServiceClient()
    const { data, error } = await service
      .from('users')
      .select('id, name, class_id, total_points, created_at, classes(id, name)')
      .eq('role', 'student')
      .order('name')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}

// 학생 추가
export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { name, pin, class_id } = await request.json()

    if (!name?.trim()) return NextResponse.json({ success: false, error: '이름을 입력하세요.' }, { status: 400 })
    if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ success: false, error: 'PIN은 4자리 숫자여야 합니다.' }, { status: 400 })

    const pin_hash = await hashPin(pin)
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), role: 'student', pin_hash, class_id: class_id || null })
      .select('id, name, class_id, total_points')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
