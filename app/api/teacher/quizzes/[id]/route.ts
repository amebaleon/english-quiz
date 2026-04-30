import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 퀴즈 이름 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const { title } = await request.json()
    if (!title?.trim()) return NextResponse.json({ success: false, error: '제목을 입력하세요.' }, { status: 400 })

    const service = await createServiceClient()
    const { error } = await service.from('quizzes').update({ title: title.trim() }).eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}

// 퀴즈 삭제 (문제도 cascade 삭제)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const service = await createServiceClient()
    const { error } = await service.from('quizzes').delete().eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}
