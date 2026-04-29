import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentId = cookieStore.get('student_id')?.value
    if (!studentId) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    if (!session_id) return NextResponse.json({ success: false, error: 'session_id 필요' }, { status: 400 })

    const service = createServiceClient()

    // 참가자별 정답 수, 획득 포인트 집계
    const [{ data: participants }, { data: answers }, { data: questions }] = await Promise.all([
      service.from('session_participants').select('student_id, users(name)').eq('session_id', session_id),
      service.from('answers').select('student_id, is_correct, question_id').eq('session_id', session_id),
      service.from('questions').select('id, points').eq('quiz_id',
        (await service.from('sessions').select('quiz_id').eq('id', session_id).single()).data?.quiz_id ?? ''
      ),
    ])

    const pointsMap = Object.fromEntries((questions ?? []).map(q => [q.id, q.points]))

    const rankings = (participants ?? []).map((p: any) => {
      const myAnswers = (answers ?? []).filter(a => a.student_id === p.student_id)
      const correct = myAnswers.filter(a => a.is_correct === true).length
      const total = myAnswers.length
      const pts = myAnswers
        .filter(a => a.is_correct === true)
        .reduce((s, a) => s + (pointsMap[a.question_id] ?? 0), 0)
      return {
        student_id: p.student_id,
        name: (p.users as any)?.name ?? '알 수 없음',
        isMe: p.student_id === studentId,
        correct,
        total,
        pts,
      }
    }).sort((a, b) => b.pts - a.pts)

    return NextResponse.json({ success: true, data: rankings })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
