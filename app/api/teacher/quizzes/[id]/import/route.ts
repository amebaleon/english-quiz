import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 })

    const { id: quiz_id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: '파일을 선택하세요.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    const errors: string[] = []
    const questions: any[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      const col = (n: number) => String(row[n] ?? '').trim()
      const question = col(0)
      const c2 = col(1), c3 = col(2), c4 = col(3), c5 = col(4)
      const c6 = col(5), c7 = col(6)

      // 빈 행 스킵
      if (!question && !c2 && !c3 && !c4 && !c5) continue
      if (!question) { errors.push(`${rowNum}행: 문제(1열)가 비어 있습니다.`); continue }

      const points = c7 ? parseInt(c7) : 10
      if (c7 && (isNaN(points) || points <= 0)) {
        errors.push(`${rowNum}행: 포인트(7열)는 양수 숫자여야 합니다.`); continue
      }

      const filledOptions = [c2, c3, c4, c5].filter(Boolean).length

      if (filledOptions === 1 && !c3 && !c4 && !c5) {
        // 주관식
        questions.push({ type: 'short', content: question, options: null, answer: c2, points })

      } else if (c2 && c3 && c4 && c5) {
        // 객관식
        const answerNum = parseInt(c6)
        if (!c6 || isNaN(answerNum) || answerNum < 1 || answerNum > 4) {
          errors.push(`${rowNum}행: 정답 번호(6열)는 1~4 사이 숫자여야 합니다.`); continue
        }
        questions.push({
          type: 'multiple',
          content: question,
          options: [c2, c3, c4, c5],
          answer: String(answerNum - 1), // 0-indexed
          points,
        })

      } else {
        errors.push(`${rowNum}행: 형식 오류 — 주관식은 2열만, 객관식은 2~5열 모두 채워야 합니다.`)
      }
    }

    if (questions.length === 0 && errors.length === 0) {
      return NextResponse.json({ success: false, error: '문제가 없습니다.' }, { status: 400 })
    }

    const service = createServiceClient()

    // 현재 마지막 order_index
    const { data: last } = await service
      .from('questions')
      .select('order_index')
      .eq('quiz_id', quiz_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    let nextIndex = (last?.order_index ?? -1) + 1

    if (questions.length > 0) {
      const { error } = await service.from('questions').insert(
        questions.map(q => ({ ...q, quiz_id, order_index: nextIndex++ }))
      )
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: questions.length, errors })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message ?? '서버 오류' }, { status: 500 })
  }
}
