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
      .select('id, quiz_id, code, status, current_question_index, created_at, quizzes(title)')
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
    const { quiz_id } = await request.json()
    if (!quiz_id) return NextResponse.json({ success: false, error: '퀴즈를 선택하세요.' }, { status: 400 })

    const service = await createServiceClient()

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
      .insert({ quiz_id, code, status: 'waiting', current_question_index: -1 })
      .select('id, quiz_id, code, status, current_question_index, quizzes(title)')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}
