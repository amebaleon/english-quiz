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
