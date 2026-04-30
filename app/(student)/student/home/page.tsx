'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'

interface Student { id: string; name: string; total_points: number }
interface RankEntry { id: string; rank: number }

export default function StudentHomePage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/profile')
      .then(r => r.json())
      .then(json => {
        if (!json.success) { router.push('/student/login'); return }
        setStudent(json.data.student)
        const ranking: RankEntry[] = json.data.ranking ?? []
        const me = ranking.find(r => r.id === json.data.student.id)
        if (me) setMyRank(me.rank)
        setLoading(false)
      })
  }, [router])

  async function handleLogout() {
    await fetch('/api/student/logout', { method: 'POST' })
    router.push('/student/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 animate-pulse" />
          <p className="text-gray-400 text-sm animate-pulse">불러오는 중...</p>
        </div>
      </div>
    )
  }

  const initial = student?.name?.[0] ?? '?'

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 safe-top safe-bottom">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white px-6 pt-10 pb-14 text-center header-wave">
        {/* 아바타 */}
        <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white">
          {initial}
        </div>
        <p className="text-emerald-100 text-sm mb-0.5">안녕하세요!</p>
        <h1 className="text-2xl font-black">{student?.name}</h1>

        {/* 포인트 + 랭킹 카드 */}
        <div className="mt-5 inline-flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
          <div className="text-center">
            <p className="text-emerald-100 text-xs mb-0.5">포인트</p>
            <p className="text-3xl font-black tracking-tight">{student?.total_points.toLocaleString()}<span className="text-lg text-emerald-200 ml-0.5">P</span></p>
          </div>
          {myRank && (
            <>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-emerald-100 text-xs mb-0.5">반 순위</p>
                <p className="text-3xl font-black">{myRank}<span className="text-lg text-emerald-200 ml-0.5">위</span></p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="flex flex-col gap-3 px-5 -mt-6 max-w-sm mx-auto w-full">
        <Link
          href="/student/join"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-md border-2 border-emerald-400 hover:bg-emerald-50 active:scale-[0.98] transition-all duration-75"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="enter" size={24} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">퀴즈 입장</p>
            <p className="text-xs text-gray-400 mt-0.5">선생님 코드 6자리 입력</p>
          </div>
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600 text-sm font-bold">→</span>
          </div>
        </Link>

        <Link
          href="/student/profile"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-[0.98] transition-all duration-75"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Icon name="chart" size={24} className="text-indigo-500" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">내 프로필</p>
            <p className="text-xs text-gray-400 mt-0.5">포인트 · 랭킹 · PIN 변경</p>
          </div>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-sm font-bold">→</span>
          </div>
        </Link>
      </div>

      {/* 로그아웃 */}
      <div className="mt-auto px-6 pb-8 text-center pt-6">
        <button
          onClick={handleLogout}
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </main>
  )
}
