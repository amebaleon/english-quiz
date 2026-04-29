import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentId = cookieStore.get('student_id')?.value
    if (!studentId) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code || code.length !== 6) {
      return NextResponse.json({ success: false, error: '6자리 코드를 입력하세요.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 세션 조회
    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('code', code)
      .single()

    if (error || !session) {
      return NextResponse.json({ success: false, error: '유효하지 않은 코드입니다.' }, { status: 404 })
    }

    if (session.status === 'finished') {
      return NextResponse.json({ success: false, error: '이미 종료된 세션입니다.' }, { status: 400 })
    }

    // 참가자 등록 (이미 있으면 무시)
    await supabase
      .from('session_participants')
      .upsert({ session_id: session.id, student_id: studentId }, { onConflict: 'session_id,student_id' })

    return NextResponse.json({ success: true, data: { sessionId: session.id } })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
