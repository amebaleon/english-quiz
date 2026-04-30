import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 문제 목록 조회
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const service = await createServiceClient()
    const { data, error } = await service
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}

// 문제 추가
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id: quiz_id } = await params
    const { type, content, options, answer, points } = await request.json()

    if (!content?.trim()) return NextResponse.json({ success: false, error: '문제 내용을 입력하세요.' }, { status: 400 })
    if (!answer?.trim()) return NextResponse.json({ success: false, error: '정답을 입력하세요.' }, { status: 400 })
    if (type === 'multiple' && (!options || options.length !== 4 || options.some((o: string) => !o.trim()))) {
      return NextResponse.json({ success: false, error: '객관식은 4개 보기를 모두 입력하세요.' }, { status: 400 })
    }

    const service = await createServiceClient()

    // 현재 마지막 order_index 조회
    const { data: last } = await service
      .from('questions')
      .select('order_index')
      .eq('quiz_id', quiz_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const order_index = (last?.order_index ?? -1) + 1

    const { data, error } = await service
      .from('questions')
      .insert({
        quiz_id,
        type,
        content: content.trim(),
        options: type === 'multiple' ? options.map((o: string) => o.trim()) : null,
        answer: answer.trim(),
        points: points ?? 10,
        order_index,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}
