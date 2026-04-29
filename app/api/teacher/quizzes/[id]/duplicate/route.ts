import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id } = await params
    const service = createServiceClient()

    const { data: original } = await service.from('quizzes').select('title').eq('id', id).single()
    if (!original) return NextResponse.json({ success: false, error: '퀴즈를 찾을 수 없습니다.' }, { status: 404 })

    const { data: newQuiz, error: qErr } = await service
      .from('quizzes')
      .insert({ title: `${original.title} (복사)` })
      .select()
      .single()
    if (qErr || !newQuiz) return NextResponse.json({ success: false, error: qErr?.message }, { status: 500 })

    const { data: questions } = await service
      .from('questions')
      .select('type, content, options, answer, points, order_index')
      .eq('quiz_id', id)
      .order('order_index')

    if (questions && questions.length > 0) {
      await service.from('questions').insert(
        questions.map(q => ({ ...q, quiz_id: newQuiz.id }))
      )
    }

    return NextResponse.json({ success: true, data: { ...newQuiz, questions: [{ count: questions?.length ?? 0 }] } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
