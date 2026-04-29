import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentId = cookieStore.get('student_id')?.value
    if (!studentId) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })

    const { session_id, question_id, content } = await request.json()
    if (!session_id || !question_id || content === undefined || content === '') {
      return NextResponse.json({ success: false, error: '답변 내용을 입력하세요.' }, { status: 400 })
    }

    const service = await createServiceClient()

    // 이미 제출한 경우 무시
    const { data: existing } = await service
      .from('answers')
      .select('id')
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .eq('student_id', studentId)
      .single()

    if (existing) return NextResponse.json({ success: true, data: { already: true } })

    const { error } = await service.from('answers').insert({
      session_id,
      question_id,
      student_id: studentId,
      content: String(content),
      is_correct: null,
    })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
