import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// 반 전체 포인트 초기화
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { class_id } = await request.json()
    if (!class_id) return NextResponse.json({ success: false, error: '반을 선택하세요.' }, { status: 400 })

    const service = await createServiceClient()

    // 해당 반 학생 ID 목록
    const { data: students } = await service
      .from('users')
      .select('id')
      .eq('class_id', class_id)
      .eq('role', 'student')

    if (!students?.length) return NextResponse.json({ success: true })

    const ids = students.map(s => s.id)
    await service.from('points_history').delete().in('student_id', ids)
    await service.from('users').update({ total_points: 0 }).in('id', ids)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
