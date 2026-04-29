import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
}

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
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
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
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
