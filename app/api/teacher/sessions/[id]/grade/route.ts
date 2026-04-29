import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cleanupStudentPoints } from '@/lib/utils/cleanup'

// 주관식 수동 채점 + 포인트 지급
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { answer_id, is_correct, points, student_id, question_id } = await request.json()
    const { id: session_id } = await params
    const service = await createServiceClient()

    // 채점 업데이트
    const { error } = await service
      .from('answers')
      .update({ is_correct })
      .eq('id', answer_id)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    // 정답이면 포인트 지급
    if (is_correct && points > 0) {
      await service.from('points_history').insert({
        student_id,
        delta: points,
        reason: `퀴즈 정답 (세션)`,
      })
      cleanupStudentPoints(service, student_id).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
