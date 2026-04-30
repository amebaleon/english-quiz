'use client'

import { useState, useRef } from 'react'
import Modal from '@/components/ui/Modal'

interface Row { name: string; pin: string; class_name: string; birth_year?: string; school?: string }

interface Props {
  onClose: () => void
  onDone: (created: number) => void
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  const rows: Row[] = []
  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const [name = '', pin = '', class_name = '', birth_year = '', school = ''] = cols
    if (name && name !== '이름') rows.push({ name, pin, class_name, birth_year, school })
  }
  return rows
}

async function parseExcel(file: File): Promise<Row[]> {
  const xlsx = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = xlsx.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 })
  const rows: Row[] = []
  for (const row of data) {
    const [name, pin, class_name, birth_year, school] = row.map((v: any) => String(v ?? '').trim())
    if (name && name !== '이름' && name !== 'undefined')
      rows.push({ name, pin: String(pin), class_name: class_name ?? '', birth_year: birth_year ?? '', school: school ?? '' })
  }
  return rows
}

export default function BulkImportModal({ onClose, onDone }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [csvText, setCsvText] = useState('')
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    try {
      let parsed: Row[]
      if (file.name.endsWith('.csv')) {
        parsed = parseCSV(await file.text())
      } else {
        parsed = await parseExcel(file)
      }
      if (parsed.length === 0) { setParseError('데이터를 찾을 수 없습니다. 형식을 확인하세요.'); return }
      setRows(parsed)
      setStep('preview')
    } catch {
      setParseError('파일 파싱 실패. CSV 또는 Excel 형식인지 확인하세요.')
    }
  }

  function handleTextParse() {
    if (!csvText.trim()) return
    setParseError('')
    const parsed = parseCSV(csvText)
    if (parsed.length === 0) { setParseError('올바른 형식이 아닙니다.'); return }
    setRows(parsed)
    setStep('preview')
  }

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch('/api/teacher/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: rows }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.success) { setParseError(json.error); return }
    setResult(json.data)
    setStep('done')
    onDone(json.data.created)
  }

  return (
    <Modal title="학생 일괄 등록" onClose={onClose} size="lg">
      {step === 'input' && (
        <div className="space-y-5">
          {/* 형식 안내 */}
          <div className="bg-indigo-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-indigo-700 mb-2">📋 파일 형식</p>
            <p className="text-indigo-600 mb-2">CSV 또는 Excel (.xlsx) — 첫 번째 시트 기준</p>
            <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-700 border border-indigo-100">
              이름,PIN,반,출생년도,학교<br/>
              홍길동,1234,1반,2012,한빛중학교<br/>
              김철수,5678,2반,,<br/>
              이영희,9012,,,
            </div>
            <p className="text-indigo-500 text-xs mt-2">· PIN 4자리 필수 · 반/출생년도/학교는 선택 (없으면 비워두기)</p>
          </div>

          {/* 파일 업로드 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">파일 업로드</p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <span className="text-2xl mb-1">📂</span>
              <span className="text-sm text-gray-500">CSV 또는 Excel 파일 선택</span>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400 shrink-0">또는 직접 붙여넣기</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* 텍스트 붙여넣기 */}
          <div>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={'이름,PIN,반,출생년도,학교\n홍길동,1234,1반,2012,한빛중학교\n김철수,5678,,,'}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleTextParse}
              disabled={!csvText.trim()}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              미리보기
            </button>
          </div>

          {parseError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{parseError}</p>}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{rows.length}명 확인됨</p>
            <button onClick={() => { setStep('input'); setRows([]); if (fileRef.current) fileRef.current.value = '' }}
              className="text-sm text-gray-400 hover:text-gray-600">다시 선택</button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
              <span>이름</span><span>PIN</span><span>반</span><span>출생</span><span>학교</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {rows.map((row, i) => (
                <div key={i} className={`grid grid-cols-5 px-4 py-2.5 text-sm ${
                  !row.pin || !/^\d{4}$/.test(row.pin) ? 'bg-red-50 text-red-600' : 'text-gray-700'
                }`}>
                  <span>{row.name}</span>
                  <span className="font-mono">{row.pin || <span className="text-red-400">없음</span>}</span>
                  <span className="text-gray-400">{row.class_name || '—'}</span>
                  <span className="text-gray-400">{row.birth_year || '—'}</span>
                  <span className="text-gray-400 truncate">{row.school || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {parseError && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{parseError}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? '등록 중...' : `${rows.length}명 등록하기`}
            </button>
            <button onClick={onClose} className="px-5 py-3 border border-gray-300 text-gray-500 rounded-xl text-sm">취소</button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-6 space-y-4">
          <div className="text-5xl">{result.errors.length === 0 ? '🎉' : '⚠️'}</div>
          <div>
            <p className="text-xl font-bold text-gray-800">{result.created}명 등록 완료</p>
            {result.errors.length > 0 && (
              <p className="text-sm text-amber-600 mt-1">{result.errors.length}건 실패</p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-3 text-left text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
          <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
            닫기
          </button>
        </div>
      )}
    </Modal>
  )
}
