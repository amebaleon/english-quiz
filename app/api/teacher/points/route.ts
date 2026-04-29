import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// 포인트 수동 조정
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { student_id, delta, reason } = await request.json()

    if (!student_id) return NextResponse.json({ success: false, error: '학생을 선택하세요.' }, { status: 400 })
    if (!delta || delta === 0) return NextResponse.json({ success: false, error: '포인트를 입력하세요.' }, { status: 400 })
    if (!reason?.trim()) return NextResponse.json({ success: false, error: '사유를 입력하세요.' }, { status: 400 })

    const service = await createServiceClient()
    const { error } = await service.from('points_history').insert({ student_id, delta, reason: reason.trim() })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
