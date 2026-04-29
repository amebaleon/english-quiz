import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// 포인트 히스토리 조회
export async function GET(_: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { studentId } = await params
    const service = await createServiceClient()
    const { data, error } = await service
      .from('points_history')
      .select('id, delta, reason, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}

// 포인트 초기화
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { studentId } = await params
    const service = await createServiceClient()

    // 히스토리 삭제 + total_points 0으로 초기화
    await service.from('points_history').delete().eq('student_id', studentId)
    const { error } = await service.from('users').update({ total_points: 0 }).eq('id', studentId)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
