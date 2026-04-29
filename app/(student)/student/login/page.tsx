'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  class_id: string | null
  classes: { name: string } | null
}

type Step = 'select' | 'pin'

export default function StudentLoginPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<Step>('select')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/student/list')
      .then(r => r.json())
      .then(({ data }) => {
        setStudents(data ?? [])
        setFilteredStudents(data ?? [])
      })
  }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setFilteredStudents(q ? students.filter(s => s.name.toLowerCase().includes(q)) : students)
  }, [search, students])

  function handleSelectStudent(student: Student) {
    setSelected(student)
    setStep('pin')
    setPin('')
    setError('')
    setTimeout(() => pinRef.current?.focus(), 100)
  }

  function handlePinInput(digit: string) {
    if (pin.length >= 4) return
    setPin(prev => prev + digit)
  }

  function handlePinDelete() {
    setPin(prev => prev.slice(0, -1))
  }

  async function handlePinSubmit() {
    if (pin.length !== 4) return
    setError('')
    setLoading(true)

    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selected!.id, pin }),
    })
    const json = await res.json()
    setLoading(false)

    if (!json.success) {
      setError(json.error ?? '로그인 실패')
      setPin('')
      return
    }

    router.push('/student/join')
  }

  // PIN 4자리 자동 제출
  useEffect(() => {
    if (pin.length === 4) handlePinSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  if (step === 'pin' && selected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom">
        <button
          onClick={() => { setStep('select'); setSelected(null) }}
          className="self-start text-emerald-700 text-sm mb-6 hover:underline"
        >
          ← 다시 선택
        </button>

        <div className="w-full max-w-xs text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{selected.name}</h2>
          <p className="text-gray-500 mb-8">PIN 4자리를 입력하세요</p>

          {/* PIN 도트 표시 */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  pin.length > i ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-6 bg-red-50 rounded-xl py-3 px-4">{error}</p>
          )}

          {/* 숫자 키패드 */}
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9'].map(d => (
              <button
                key={d}
                onClick={() => handlePinInput(d)}
                disabled={loading}
                className="h-16 text-2xl font-semibold bg-white border border-gray-200 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
              >
                {d}
              </button>
            ))}
            <div /> {/* 빈 칸 */}
            <button
              onClick={() => handlePinInput('0')}
              disabled={loading}
              className="h-16 text-2xl font-semibold bg-white border border-gray-200 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              disabled={loading}
              className="h-16 text-2xl bg-white border border-gray-200 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
            >
              ⌫
            </button>
          </div>

          {loading && (
            <p className="text-emerald-600 mt-6 font-medium">로그인 중...</p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-white safe-top safe-bottom">
      <div className="bg-emerald-500 text-white px-6 pt-8 pb-6">
        <Link href="/" className="text-emerald-100 text-sm hover:underline block mb-4">
          ← 처음으로
        </Link>
        <h1 className="text-2xl font-bold">학생 로그인</h1>
        <p className="text-emerald-100 text-sm mt-1">이름을 선택하세요</p>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <input
          type="search"
          placeholder="이름 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 placeholder-gray-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <p className="text-center text-gray-400 py-16">
            {students.length === 0 ? '학생이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filteredStudents.map(student => (
              <li key={student.id}>
                <button
                  onClick={() => handleSelectStudent(student)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-emerald-50 active:bg-emerald-100 transition-colors text-left"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{student.name}</p>
                    {student.classes && (
                      <p className="text-sm text-gray-400">{student.classes.name}</p>
                    )}
                  </div>
                  <span className="text-gray-300 text-xl">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
