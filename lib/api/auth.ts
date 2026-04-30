import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function assertTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
}

export function handleApiError(e: unknown): NextResponse {
  if (e instanceof Error && e.message === 'UNAUTHORIZED')
    return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
  return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
}
