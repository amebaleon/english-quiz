'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student { name: string; total_points: number }

export default function StudentHomePage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/profile')
      .then(r => r.json())
      .then(json => {
        if (!json.success) { router.push('/student/login'); return }
        setStudent(json.data.student)
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
        <p className="text-gray-400 animate-pulse">불러오는 중...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-emerald-50 safe-top safe-bottom">
      {/* 헤더 */}
      <div className="bg-emerald-500 text-white px-6 pt-10 pb-8 text-center">
        <div className="text-5xl mb-3">👋</div>
        <h1 className="text-2xl font-bold">{student?.name}님, 안녕하세요!</h1>
        <p className="text-emerald-100 mt-1 text-sm">
          총 포인트: <span className="font-bold text-white">{student?.total_points.toLocaleString()}P</span>
        </p>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 flex flex-col gap-4 p-6 max-w-sm mx-auto w-full mt-4">
        <Link
          href="/student/join"
          className="flex items-center gap-5 bg-white rounded-2xl border-2 border-emerald-400 p-6 shadow-sm hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
        >
          <span className="text-4xl">🎯</span>
          <div>
            <p className="text-lg font-bold text-gray-800">세션 입장</p>
            <p className="text-sm text-gray-500">선생님이 알려준 코드 입력</p>
          </div>
        </Link>

        <Link
          href="/student/profile"
          className="flex items-center gap-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <span className="text-4xl">📊</span>
          <div>
            <p className="text-lg font-bold text-gray-800">내 프로필</p>
            <p className="text-sm text-gray-500">포인트 및 반 랭킹 확인</p>
          </div>
        </Link>
      </div>

      {/* 로그아웃 */}
      <div className="px-6 pb-8 text-center">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          로그아웃
        </button>
      </div>
    </main>
  )
}
