'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentJoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  function handleInput(digit: string) {
    if (code.length >= 6 || loading) return
    const next = code + digit
    setCode(next)
    if (next.length === 6) {
      setTimeout(() => {
        setError('')
        setLoading(true)
        fetch('/api/student/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: next }),
        }).then(r => r.json()).then(json => {
          setLoading(false)
          if (!json.success) {
            setError(json.error ?? '세션을 찾을 수 없습니다.')
            setCode('')
            setShake(true)
            setTimeout(() => setShake(false), 500)
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
          } else {
            router.push(`/student/quiz?session=${json.data.sessionId}`)
          }
        }).catch(() => { setLoading(false); setError('연결 오류') })
      }, 150)
    }
  }

  function handleDelete() {
    setCode(prev => prev.slice(0, -1))
  }

  async function handleJoin() {
    if (code.length !== 6) return
    setError('')
    setLoading(true)

    const res = await fetch('/api/student/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const json = await res.json()
    setLoading(false)

    if (!json.success) {
      setError(json.error ?? '세션을 찾을 수 없습니다.')
      setCode('')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
      return
    }

    router.push(`/student/quiz?session=${json.data.sessionId}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom">
      <Link href="/student/login" className="self-start text-emerald-700 text-sm mb-6 hover:underline">
        ← 로그인으로
      </Link>

      <div className="w-full max-w-xs text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">세션 입장</h2>
        <p className="text-gray-500 mb-8">선생님이 알려준 6자리 코드를 입력하세요</p>

        {/* 코드 표시 */}
        <div className={`flex justify-center gap-2 mb-8 ${shake ? 'shake' : ''}`}>
          {[0,1,2,3,4,5].map(i => (
            <div
              key={i}
              className={`w-11 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 transition-colors ${
                code.length > i
                  ? 'bg-white border-emerald-500 text-emerald-600'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {code[i] ?? '·'}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-6 bg-red-50 rounded-xl py-3 px-4">{error}</p>
        )}

        {/* 숫자 키패드 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handleInput(d)}
              disabled={loading}
              className="h-16 text-2xl font-semibold bg-white border border-gray-200 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleInput('0')}
            disabled={loading}
            className="h-16 text-2xl font-semibold bg-white border border-gray-200 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-16 text-2xl bg-white border border-gray-200 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleJoin}
          disabled={code.length !== 6 || loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-2xl transition-colors"
        >
          {loading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </main>
  )
}
