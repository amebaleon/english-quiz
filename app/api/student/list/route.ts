import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, class_id, classes(name)')
      .eq('role', 'student')
      .order('name')

    if (error) {
      return NextResponse.json({ success: false, error: '학생 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
