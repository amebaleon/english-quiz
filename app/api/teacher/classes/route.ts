import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { assertTeacher } from '@/lib/api/auth'

export async function GET() {
  try {
    await assertTeacher()
    const service = await createServiceClient()
    const { data, error } = await service.from('classes').select('id, name').order('name')
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[GET /api/teacher/classes]', e)
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: e.message ?? '서버 오류' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ success: false, error: '반 이름을 입력하세요.' }, { status: 400 })
    const service = await createServiceClient()
    const { data, error } = await service.from('classes').insert({ name: name.trim() }).select().single()
    if (error) {
      console.error('[POST /api/teacher/classes] supabase error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[POST /api/teacher/classes] caught:', e)
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })
    return NextResponse.json({ success: false, error: e.message ?? '서버 오류' }, { status: 500 })
  }
}
