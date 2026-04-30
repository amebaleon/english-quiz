import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// 현재 세션 + 현재 문제 정보 조회
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentId = cookieStore.get('student_id')?.value
    if (!studentId) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    if (!session_id) return NextResponse.json({ success: false, error: 'session_id 필요' }, { status: 400 })

    const service = await createServiceClient()

    const { data: session } = await service
      .from('sessions')
      .select('id, status, current_question_index, quiz_id, exam_mode')
      .eq('id', session_id)
      .single()

    if (!session) return NextResponse.json({ success: false, error: '세션을 찾을 수 없습니다.' }, { status: 404 })

    let question = null
    let myAnswer = null

    if (session.current_question_index >= 0) {
      const { data: q } = await service
        .from('questions')
        .select('id, type, content, options, answer, points, order_index')
        .eq('quiz_id', session.quiz_id)
        .eq('order_index', session.current_question_index)
        .single()

      // 정답은 revealed 상태에서만 노출
      question = q ? {
        ...q,
        answer: session.status === 'revealed' ? q.answer : undefined,
      } : null

      if (q) {
        const { data: ans } = await service
          .from('answers')
          .select('id, content, is_correct')
          .eq('session_id', session_id)
          .eq('question_id', q.id)
          .eq('student_id', studentId)
          .single()
        myAnswer = ans
      }
    }

    return NextResponse.json({ success: true, data: { session, question, myAnswer } })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
