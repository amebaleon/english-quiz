import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hashPin } from '@/lib/utils/pin'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id } = await params
    const { pin } = await request.json()

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'PIN은 4자리 숫자여야 합니다.' }, { status: 400 })
    }

    const pin_hash = await hashPin(pin)
    const service = await createServiceClient()
    const { error } = await service.from('users').update({ pin_hash }).eq('id', id).eq('role', 'student')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
