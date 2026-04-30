import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 문제 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    await assertTeacher()
    const { qid } = await params
    const { type, content, options, answer, points } = await request.json()

    if (!content?.trim()) return NextResponse.json({ success: false, error: '문제 내용을 입력하세요.' }, { status: 400 })
    if (!answer?.trim()) return NextResponse.json({ success: false, error: '정답을 입력하세요.' }, { status: 400 })
    if (type === 'multiple' && (!options || options.length !== 4 || options.some((o: string) => !o.trim()))) {
      return NextResponse.json({ success: false, error: '객관식은 4개 보기를 모두 입력하세요.' }, { status: 400 })
    }

    const service = await createServiceClient()
    const { error } = await service
      .from('questions')
      .update({
        type,
        content: content.trim(),
        options: type === 'multiple' ? options.map((o: string) => o.trim()) : null,
        answer: answer.trim(),
        points: points ?? 10,
      })
      .eq('id', qid)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}

// 문제 삭제
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    await assertTeacher()
    const { qid } = await params
    const service = await createServiceClient()
    const { error } = await service.from('questions').delete().eq('id', qid)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}

// 문제 순서 변경
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    await assertTeacher()
    const { qid } = await params
    const { order_index } = await request.json()
    const service = await createServiceClient()
    const { error } = await service.from('questions').update({ order_index }).eq('id', qid)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}
