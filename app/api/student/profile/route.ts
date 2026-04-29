import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const studentId = cookieStore.get('student_id')?.value
    if (!studentId) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })

    const service = await createServiceClient()

    const { data: student } = await service
      .from('users')
      .select('id, name, total_points, class_id')
      .eq('id', studentId)
      .single()

    if (!student) return NextResponse.json({ success: false, error: '학생을 찾을 수 없습니다.' }, { status: 404 })

    // 같은 반 학생 랭킹 (반 없으면 전체)
    let rankQuery = service
      .from('users')
      .select('id, name, total_points')
      .eq('role', 'student')
      .order('total_points', { ascending: false })

    if (student.class_id) {
      rankQuery = rankQuery.eq('class_id', student.class_id)
    }

    const { data: rankList } = await rankQuery

    const ranking = (rankList ?? []).map((s, i) => ({ ...s, rank: i + 1 }))

    return NextResponse.json({ success: true, data: { student, ranking } })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
