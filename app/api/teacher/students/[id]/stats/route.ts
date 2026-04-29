import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id } = await params
    const service = await createServiceClient()

    const { data: answers } = await service
      .from('answers')
      .select('id, is_correct, submitted_at, sessions(code, created_at, quizzes(title))')
      .eq('student_id', id)
      .order('submitted_at', { ascending: false })

    const total = answers?.length ?? 0
    const correct = answers?.filter(a => a.is_correct === true).length ?? 0
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    return NextResponse.json({ success: true, data: { total, correct, accuracy, answers } })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
