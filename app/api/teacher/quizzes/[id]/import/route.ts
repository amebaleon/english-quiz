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
      const optCountRaw = col(1)

      // 빈 행 스킵
      if (!question && !optCountRaw && row.slice(2).every(v => String(v ?? '').trim() === '')) continue
      if (!question) { errors.push(`${rowNum}행: 문제(1열)가 비어 있습니다.`); continue }

      // 2열(선지수) 명시 여부에 따라 파싱 분기
      if (optCountRaw !== '') {
        // ── 명시 모드 ──────────────────────────────────────
        const optCount = parseInt(optCountRaw)
        if (isNaN(optCount) || optCount < 1) {
          errors.push(`${rowNum}행: 2열(선지수)은 1 이상의 정수여야 합니다.`); continue
        }

        if (optCount === 1) {
          // 주관식: 3열=정답, 4열=포인트
          const answer = col(2)
          const pointsRaw = col(3)
          if (!answer) { errors.push(`${rowNum}행: 3열(정답)이 비어 있습니다.`); continue }
          const points = pointsRaw ? parseInt(pointsRaw) : 10
          if (pointsRaw && (isNaN(points) || points <= 0)) {
            errors.push(`${rowNum}행: 포인트는 양수 숫자여야 합니다.`); continue
          }
          questions.push({ type: 'short', content: question, options: null, answer, points })

        } else {
          // 객관식: 3열~(2+optCount)열=선지, 다음열=정답번호(1-indexed), 다음열=포인트
          const optionCols = Array.from({ length: optCount }, (_, k) => col(2 + k))
          const answerRaw = col(2 + optCount)
          const pointsRaw = col(3 + optCount)

          const emptyOpts = optionCols.map((o, k) => !o ? k + 3 : null).filter(Boolean)
          if (emptyOpts.length > 0) {
            errors.push(`${rowNum}행: ${emptyOpts.map(k => `${k}열`).join(', ')} 선지가 비어 있습니다.`); continue
          }

          const answerNum = parseInt(answerRaw)
          if (!answerRaw || isNaN(answerNum) || answerNum < 1 || answerNum > optCount) {
            errors.push(`${rowNum}행: 정답 번호는 1~${optCount} 사이 숫자여야 합니다.`); continue
          }

          const points = pointsRaw ? parseInt(pointsRaw) : 10
          if (pointsRaw && (isNaN(points) || points <= 0)) {
            errors.push(`${rowNum}행: 포인트는 양수 숫자여야 합니다.`); continue
          }

          questions.push({
            type: 'multiple',
            content: question,
            options: optionCols,
            answer: String(answerNum - 1),
            points,
          })
        }

      } else {
        // ── 자동인식 모드 (2열 비어있음) ──────────────────
        // col(2)부터 행 끝까지 값이 있는 것만 추출 (trailing empty 제거)
        const tail: string[] = []
        for (let k = 2; k < row.length; k++) {
          const v = String(row[k] ?? '').trim()
          if (v !== '') tail.push(v)
        }
        // trailing empty 제거 (이미 위에서 처리됨)

        if (tail.length < 2) {
          errors.push(`${rowNum}행: 정답과 포인트를 포함해 최소 2개 열이 필요합니다.`); continue
        }

        const pointsRaw = tail[tail.length - 1]
        const answerRaw = tail[tail.length - 2]
        const options = tail.slice(0, tail.length - 2)

        const points = parseInt(pointsRaw)
        if (isNaN(points) || points <= 0) {
          errors.push(`${rowNum}행: 마지막 열(포인트)은 양수 숫자여야 합니다.`); continue
        }

        if (options.length === 0) {
          // 주관식
          questions.push({ type: 'short', content: question, options: null, answer: answerRaw, points })

        } else {
          // 객관식
          const answerNum = parseInt(answerRaw)
          if (isNaN(answerNum) || answerNum < 1 || answerNum > options.length) {
            errors.push(`${rowNum}행: 정답 번호는 1~${options.length} 사이 숫자여야 합니다.`); continue
          }
          questions.push({
            type: 'multiple',
            content: question,
            options,
            answer: String(answerNum - 1),
            points,
          })
        }
      }
    }

    if (questions.length === 0 && errors.length === 0) {
      return NextResponse.json({ success: false, error: '문제가 없습니다.' }, { status: 400 })
    }

    const service = createServiceClient()

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
