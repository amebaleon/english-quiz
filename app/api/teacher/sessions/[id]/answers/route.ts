import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// 특정 문제의 답변 목록 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const question_id = searchParams.get('question_id')
    if (!question_id) return NextResponse.json({ success: false, error: 'question_id 필요' }, { status: 400 })

    const service = await createServiceClient()
    const { data, error } = await service
      .from('answers')
      .select('id, content, is_correct, student_id, users(name)')
      .eq('session_id', id)
      .eq('question_id', question_id)
      .order('submitted_at')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
