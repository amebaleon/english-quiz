import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSessionCode } from '@/lib/utils/pin'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 진행 중인 세션 조회
export async function GET() {
  try {
    await assertTeacher()
    const service = await createServiceClient()
    const { data } = await service
      .from('sessions')
      .select('id, quiz_id, code, status, current_question_index, exam_mode, created_at, quizzes(title)')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ success: true, data: data ?? null })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: true, data: null })
  }
}

// 새 세션 생성
export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { quiz_id, exam_mode, total_questions } = await request.json()

    const service = await createServiceClient()
    let finalQuizId = quiz_id

    // 백지시험 모드: 퀴즈 없이 시작하면 임시 퀴즈 자동 생성
    if (exam_mode && !quiz_id) {
      const questionCount = Math.min(Math.max(parseInt(total_questions) || 10, 1), 50)
      const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

      const { data: tempQuiz, error: quizErr } = await service
        .from('quizzes')
        .insert({ title: `백지시험 ${today}` })
        .select('id')
        .single()

      if (quizErr || !tempQuiz) return NextResponse.json({ success: false, error: '세션 생성 실패' }, { status: 500 })

      await service.from('questions').insert(
        Array.from({ length: questionCount }, (_, i) => ({
          quiz_id: tempQuiz.id,
          type: 'short',
          content: `${i + 1}번`,
          answer: '-',
          points: 0,
          order_index: i,
        }))
      )
      finalQuizId = tempQuiz.id
    }

    if (!finalQuizId) return NextResponse.json({ success: false, error: '퀴즈를 선택하세요.' }, { status: 400 })

    // 기존 진행 중 세션 종료
    await service
      .from('sessions')
      .update({ status: 'finished' })
      .in('status', ['waiting', 'active'])

    // 고유 코드 생성 (충돌 방지)
    let code = generateSessionCode()
    for (let i = 0; i < 5; i++) {
      const { data } = await service.from('sessions').select('id').eq('code', code).single()
      if (!data) break
      code = generateSessionCode()
    }

    const { data, error } = await service
      .from('sessions')
      .insert({ quiz_id: finalQuizId, code, status: 'waiting', current_question_index: -1, exam_mode: !!exam_mode })
      .select('id, quiz_id, code, status, current_question_index, exam_mode, quizzes(title)')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}
