import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

export async function GET() {
  try {
    await assertTeacher()
    const service = await createServiceClient()
    const { data, error } = await service
      .from('quizzes')
      .select('id, title, created_at, questions(count)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { title } = await request.json()
    if (!title?.trim()) return NextResponse.json({ success: false, error: '제목을 입력하세요.' }, { status: 400 })

    const service = await createServiceClient()
    const { data, error } = await service
      .from('quizzes')
      .insert({ title: title.trim() })
      .select('id, title, created_at')
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return handleApiError(e)
  }
}
