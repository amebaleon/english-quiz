import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const service = createServiceClient()

    // 최근 10개 ID 조회
    const { data: recent } = await service
      .from('sessions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!recent || recent.length === 0) return NextResponse.json({ success: true, deleted: 0 })

    const keepIds = recent.map(s => s.id)

    const { data: deleted, error } = await service
      .from('sessions')
      .delete()
      .not('id', 'in', `(${keepIds.map(id => `"${id}"`).join(',')})`)
      .select('id')

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deleted: deleted?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
