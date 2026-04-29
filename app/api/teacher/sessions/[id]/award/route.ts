import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { cleanupStudentPoints } from '@/lib/utils/cleanup'

// 객관식 정답자 일괄 포인트 지급
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { question_id, correct_answer, points } = await request.json()
    const { id: session_id } = await params
    const service = await createServiceClient()

    // 해당 문제의 모든 답변 조회
    const { data: answers } = await service
      .from('answers')
      .select('id, student_id, content')
      .eq('session_id', session_id)
      .eq('question_id', question_id)

    if (!answers?.length) return NextResponse.json({ success: true, data: { correct: 0 } })

    // 정답 여부 판정 및 업데이트
    const updates = answers.map(a => ({
      id: a.id,
      is_correct: a.content === correct_answer,
    }))

    await Promise.all(
      updates.map(u =>
        service.from('answers').update({ is_correct: u.is_correct }).eq('id', u.id)
      )
    )

    // 정답자 포인트 지급
    const correctStudents = updates.filter(u => u.is_correct).map(u => u.id)
    const correctAnswers = answers.filter(a => a.content === correct_answer)

    if (correctAnswers.length > 0 && points > 0) {
      await service.from('points_history').insert(
        correctAnswers.map(a => ({
          student_id: a.student_id,
          delta: points,
          reason: '퀴즈 정답',
        }))
      )
      correctAnswers.forEach(a => cleanupStudentPoints(service, a.student_id).catch(() => {}))
    }

    return NextResponse.json({ success: true, data: { correct: correctAnswers.length } })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
