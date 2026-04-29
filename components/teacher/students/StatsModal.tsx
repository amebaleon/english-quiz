'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'

interface Props {
  student: { id: string; name: string }
  onClose: () => void
}

interface Stats {
  total: number
  correct: number
  accuracy: number
  answers: any[]
}

export default function StatsModal({ student, onClose }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/teacher/students/${student.id}/stats`)
      .then(r => r.json())
      .then(json => { if (json.success) setStats(json.data) })
      .finally(() => setLoading(false))
  }, [student.id])

  return (
    <Modal title={`${student.name} — 퀴즈 통계`} onClose={onClose} size="md">
      {loading ? (
        <p className="text-center text-gray-400 py-8">불러오는 중...</p>
      ) : !stats ? (
        <p className="text-center text-gray-400 py-8">데이터를 불러올 수 없습니다.</p>
      ) : (
        <div>
          {/* 요약 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-gray-50 rounded-2xl p-4">
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">총 답변</p>
            </div>
            <div className="text-center bg-emerald-50 rounded-2xl p-4">
              <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
              <p className="text-xs text-gray-500 mt-1">정답</p>
            </div>
            <div className="text-center bg-indigo-50 rounded-2xl p-4">
              <p className="text-2xl font-bold text-indigo-600">{stats.accuracy}%</p>
              <p className="text-xs text-gray-500 mt-1">정답률</p>
            </div>
          </div>

          {/* 정답률 바 */}
          <div className="mb-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
          </div>

          {/* 최근 답변 */}
          {stats.answers.length === 0 ? (
            <p className="text-center text-gray-400 py-4">아직 참여한 세션이 없습니다.</p>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">최근 답변</h4>
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {stats.answers.slice(0, 30).map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                    <div>
                      <span className="text-gray-700">{a.sessions?.quizzes?.title ?? '(삭제된 퀴즈)'}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {new Date(a.submitted_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <span className={`font-bold ${a.is_correct === true ? 'text-emerald-500' : a.is_correct === false ? 'text-red-400' : 'text-gray-400'}`}>
                      {a.is_correct === true ? '정답' : a.is_correct === false ? '오답' : '채점 전'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
