import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const service = createServiceClient()

    const [{ data: participants }, { data: correctAnswers }] = await Promise.all([
      service
        .from('session_participants')
        .select('student_id, users(name)')
        .eq('session_id', id),
      service
        .from('answers')
        .select('student_id, questions(points)')
        .eq('session_id', id)
        .eq('is_correct', true),
    ])

    const scoreMap: Record<string, number> = {}
    correctAnswers?.forEach(a => {
      const pts = (a.questions as any)?.points ?? 0
      scoreMap[a.student_id] = (scoreMap[a.student_id] ?? 0) + pts
    })

    const ranking = (participants ?? [])
      .map(p => ({
        student_id: p.student_id,
        name: (p.users as any)?.name ?? '알 수 없음',
        points: scoreMap[p.student_id] ?? 0,
      }))
      .sort((a, b) => b.points - a.points)

    return NextResponse.json({ success: true, data: ranking })
  } catch (e) {
    return handleApiError(e)
  }
}
