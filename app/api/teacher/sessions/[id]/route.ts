import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

// 세션 상태 변경 (다음 문제, 종료 등)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTeacher()
    const { id } = await params
    const body = await request.json()
    const service = await createServiceClient()
    const { error } = await service.from('sessions').update(body).eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleApiError(e)
  }
}
