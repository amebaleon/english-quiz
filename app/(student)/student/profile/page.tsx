'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student { id: string; name: string; total_points: number; class_id: string | null }
interface RankEntry { id: string; name: string; total_points: number; rank: number }

export default function StudentProfilePage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  // PIN change state
  const [showPinForm, setShowPinForm] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/student/profile')
      .then(r => r.json())
      .then(json => {
        if (!json.success) { router.push('/student/login'); return }
        setStudent(json.data.student)
        setRanking(json.data.ranking)
        setLoading(false)
      })
  }, [router])

  async function handleLogout() {
    await fetch('/api/student/logout', { method: 'POST' })
    router.push('/student/login')
  }

  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault()
    setPinError('')
    if (newPin !== confirmPin) { setPinError('새 PIN이 일치하지 않습니다.'); return }
    if (!/^\d{4,6}$/.test(newPin)) { setPinError('PIN은 4~6자리 숫자여야 합니다.'); return }
    setPinLoading(true)
    const res = await fetch('/api/student/pin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    })
    const json = await res.json()
    setPinLoading(false)
    if (!json.success) { setPinError(json.error); return }
    setPinSuccess(true)
    setCurrentPin(''); setNewPin(''); setConfirmPin('')
    setTimeout(() => { setPinSuccess(false); setShowPinForm(false) }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  const myRank = ranking.find(r => r.id === student?.id)

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* 헤더 */}
      <div className="bg-emerald-500 text-white px-6 pt-8 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/student/home" className="text-emerald-100 text-sm">← 홈</Link>
          <button onClick={handleLogout} className="text-emerald-100 text-sm hover:text-white">로그아웃</button>
        </div>
        <h1 className="text-2xl font-bold">{student?.name}</h1>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-5xl font-black">{student?.total_points.toLocaleString()}</span>
          <span className="text-emerald-200 text-xl mb-1">P</span>
        </div>
        {myRank && (
          <p className="text-emerald-100 text-sm mt-1">반 {myRank.rank}위</p>
        )}
      </div>

      {/* PIN 변경 */}
      <div className="px-4 pt-6">
        {!showPinForm ? (
          <button
            onClick={() => setShowPinForm(true)}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-4 active:scale-[0.98] transition-all duration-75"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-lg">🔑</div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">PIN 변경</p>
                <p className="text-xs text-gray-400">로그인 PIN 번호를 바꿉니다</p>
              </div>
            </div>
            <span className="text-gray-300 text-sm">→</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">PIN 변경</h3>
              <button onClick={() => { setShowPinForm(false); setPinError(''); setCurrentPin(''); setNewPin(''); setConfirmPin('') }}
                className="text-gray-400 text-sm hover:text-gray-600">취소</button>
            </div>
            {pinSuccess ? (
              <div className="text-center py-6 animate-bounce-in">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-emerald-600 font-semibold">PIN이 변경되었습니다!</p>
              </div>
            ) : (
              <form onSubmit={handlePinChange} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">현재 PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="현재 PIN 입력"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">새 PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="새 PIN (4~6자리)"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">새 PIN 확인</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="새 PIN 다시 입력"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
                <button
                  type="submit"
                  disabled={pinLoading || !currentPin || !newPin || !confirmPin}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-colors active:scale-[0.98]"
                >
                  {pinLoading ? '변경 중...' : 'PIN 변경'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 랭킹 */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">반 랭킹</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {ranking.length === 0 ? (
            <p className="text-center text-gray-400 py-8">랭킹 정보가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {ranking.map(r => {
                const isMe = r.id === student?.id
                const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : null
                return (
                  <li key={r.id} className={`flex items-center gap-4 px-5 py-4 ${isMe ? 'bg-emerald-50' : ''}`}>
                    <div className="w-8 text-center">
                      {medal ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-400">{r.rank}</span>
                      )}
                    </div>
                    <span className={`flex-1 font-medium ${isMe ? 'text-emerald-700 font-bold' : 'text-gray-700'}`}>
                      {r.name} {isMe && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full ml-1">나</span>}
                    </span>
                    <span className={`font-bold ${isMe ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {r.total_points.toLocaleString()} P
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
