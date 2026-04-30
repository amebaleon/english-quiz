import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 학생 삭제
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const supabase = await createServiceClient()
    const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'student')
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}

// 학생 정보 수정 (반 변경)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const body = await request.json()
    const supabase = await createServiceClient()
    const { error } = await supabase.from('users').update(body).eq('id', id).eq('role', 'student')
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}
