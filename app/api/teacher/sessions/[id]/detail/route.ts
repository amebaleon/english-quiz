import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id: sessionId } = await params
    const service = createServiceClient()

    // 세션 기본 정보
    const { data: session, error: sErr } = await service
      .from('sessions')
      .select('id, code, status, created_at, quizzes(title)')
      .eq('id', sessionId)
      .single()
    if (sErr) return NextResponse.json({ success: false, error: sErr.message }, { status: 500 })

    // 문제 수 (전체 포인트 계산용)
    const { data: questions } = await service
      .from('questions')
      .select('id, points')
      .eq('quiz_id', (session.quizzes as any)?.id ?? '')

    const totalQuestions = questions?.length ?? 0
    const maxPoints = questions?.reduce((s, q) => s + q.points, 0) ?? 0

    // 참가자 목록
    const { data: participants } = await service
      .from('session_participants')
      .select('student_id, joined_at, users(id, name, class_id, classes(name))')
      .eq('session_id', sessionId)

    // 해당 세션 답변 전체
    const { data: answers } = await service
      .from('answers')
      .select('student_id, question_id, is_correct, questions(points)')
      .eq('session_id', sessionId)

    // 학생별 집계
    const stats = (participants ?? []).map((p: any) => {
      const student = p.users
      const myAnswers = (answers ?? []).filter((a: any) => a.student_id === p.student_id)
      const correct = myAnswers.filter((a: any) => a.is_correct === true).length
      const answered = myAnswers.length
      const pointsEarned = myAnswers
        .filter((a: any) => a.is_correct === true)
        .reduce((s: number, a: any) => s + (a.questions?.points ?? 0), 0)
      const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

      return {
        id: student.id,
        name: student.name,
        className: student.classes?.name ?? null,
        answered,
        correct,
        accuracy,
        pointsEarned,
        totalQuestions,
        maxPoints,
        joinedAt: p.joined_at,
      }
    }).sort((a: any, b: any) => b.pointsEarned - a.pointsEarned)

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          code: session.code,
          status: session.status,
          createdAt: session.created_at,
          quizTitle: (session.quizzes as any)?.title ?? '(삭제된 퀴즈)',
          totalQuestions,
          maxPoints,
        },
        participants: stats,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
