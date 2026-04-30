import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPin } from '@/lib/utils/pin'
import { assertTeacher, handleApiError } from '@/lib/api/auth'

interface StudentRow { name: string; pin: string; class_name?: string }

export async function POST(request: NextRequest) {
  try {
    await assertTeacher()
    const { students }: { students: StudentRow[] } = await request.json()

    if (!Array.isArray(students) || students.length === 0)
      return NextResponse.json({ success: false, error: '학생 데이터가 없습니다.' }, { status: 400 })
    if (students.length > 200)
      return NextResponse.json({ success: false, error: '한 번에 최대 200명까지 등록할 수 있습니다.' }, { status: 400 })

    const service = createServiceClient()

    // 반 이름 → id 매핑 (없으면 생성)
    const classNameSet = new Set(students.map(s => s.class_name?.trim()).filter(Boolean) as string[])
    const classMap: Record<string, string> = {}

    if (classNameSet.size > 0) {
      const { data: existing } = await service
        .from('classes')
        .select('id, name')
        .in('name', Array.from(classNameSet))

      for (const cls of existing ?? []) classMap[cls.name] = cls.id

      const toCreate = Array.from(classNameSet).filter(n => !classMap[n])
      if (toCreate.length > 0) {
        const { data: created } = await service
          .from('classes')
          .insert(toCreate.map(name => ({ name })))
          .select('id, name')
        for (const cls of created ?? []) classMap[cls.name] = cls.id
      }
    }

    // 학생 일괄 삽입
    const errors: string[] = []
    let created = 0

    for (const row of students) {
      if (!row.name?.trim()) { errors.push(`이름 없는 행 건너뜀`); continue }
      if (!row.pin || !/^\d{4}$/.test(row.pin)) { errors.push(`${row.name}: PIN이 4자리 숫자가 아님`); continue }

      const pin_hash = await hashPin(row.pin)
      const class_id = row.class_name?.trim() ? (classMap[row.class_name.trim()] ?? null) : null

      const { error } = await service
        .from('users')
        .insert({ name: row.name.trim(), role: 'student', pin_hash, class_id })

      if (error) errors.push(`${row.name}: ${error.message}`)
      else created++
    }

    return NextResponse.json({ success: true, data: { created, errors } })
  } catch (e) {
    return handleApiError(e)
  }
}
