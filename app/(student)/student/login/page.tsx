'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'name' | 'pin'

export default function StudentLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  function handleNameNext() {
    if (!name.trim()) return
    setError('')
    setStep('pin')
  }

  function handlePinInput(digit: string) {
    if (pin.length >= 4 || loading) return
    setPin(prev => prev + digit)
  }

  function handlePinDelete() {
    setPin(prev => prev.slice(0, -1))
  }

  useEffect(() => {
    if (pin.length === 4) handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pin }),
    })
    const json = await res.json()
    setLoading(false)

    if (!json.success) {
      setError(json.error ?? '로그인 실패')
      setPin('')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
      return
    }

    router.push('/student/home')
  }

  if (step === 'pin') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom">
        <button
          onClick={() => { setStep('name'); setPin(''); setError('') }}
          className="self-start text-emerald-700 text-sm mb-6 hover:underline"
        >
          ← 다시 입력
        </button>

        <div className="w-full max-w-xs text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{name}</h2>
          <p className="text-gray-500 mb-8">PIN 4자리를 입력하세요</p>

          <div className={`flex justify-center gap-4 mb-8 ${shake ? 'shake' : ''}`}>
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
            <div />
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

          {loading && <p className="text-emerald-600 mt-6 font-medium">로그인 중...</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom">
      <Link href="/" className="self-start text-emerald-700 text-sm mb-6 hover:underline">
        ← 처음으로
      </Link>

      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">학생 로그인</h2>
          <p className="text-gray-500 text-sm">이름을 입력하세요</p>
        </div>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleNameNext()}
          placeholder="이름 입력"
          autoFocus
          className="w-full px-5 py-4 text-xl text-center border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-400 text-gray-800 mb-4"
        />

        <button
          onClick={handleNameNext}
          disabled={!name.trim()}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-2xl transition-colors"
        >
          다음 →
        </button>
      </div>
    </main>
  )
}
