'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Tutorial from '@/components/teacher/Tutorial'
import * as XLSX from 'xlsx'

interface Session {
  id: string
  code: string
  status: string
  created_at: string
  quizzes: { title: string } | null
}

interface Props {
  studentCount: number
  quizCount: number
  recentSessions: Session[]
}

interface ParticipantStat {
  id: string
  name: string
  className: string | null
  answered: number
  correct: number
  accuracy: number
  pointsEarned: number
  totalQuestions: number
  maxPoints: number
}

interface SessionDetail {
  session: {
    id: string
    code: string
    status: string
    createdAt: string
    quizTitle: string
    totalQuestions: number
    maxPoints: number
  }
  participants: ParticipantStat[]
}

const statusLabel: Record<string, string> = { waiting: '대기 중', active: '진행 중', finished: '완료' }
const statusColor: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  finished: 'bg-gray-100 text-gray-500',
}

export default function DashboardClient({ studentCount, quizCount, recentSessions }: Props) {
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const detailCache = useRef<Record<string, SessionDetail>>({})

  useEffect(() => {
    fetch('/api/teacher/sessions/cleanup', { method: 'DELETE' }).catch(() => {})
  }, [])

  function exportExcel(d: SessionDetail) {
    const rows = d.participants.map((p, i) => ({
      순위: i + 1,
      이름: p.name,
      반: p.className ?? '-',
      정답수: p.correct,
      응답수: p.answered,
      정답률: `${p.accuracy}%`,
      획득포인트: p.pointsEarned,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '결과')
    XLSX.writeFile(wb, `${d.session.quizTitle}_결과.xlsx`)
  }

  async function openDetail(sessionId: string) {
    if (detailCache.current[sessionId]) { setDetail(detailCache.current[sessionId]); return }
    setLoading(true)
    setDetail(null)
    const res = await fetch(`/api/teacher/sessions/${sessionId}/detail`)
    const json = await res.json()
    if (json.success) {
      detailCache.current[sessionId] = json.data
      setDetail(json.data)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <Tutorial />
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">전체 학생</p>
          <p className="text-4xl font-bold text-indigo-600">{studentCount}</p>
          <p className="text-sm text-gray-400 mt-1">명</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">퀴즈 세트</p>
          <p className="text-4xl font-bold text-indigo-600">{quizCount}</p>
          <p className="text-sm text-gray-400 mt-1">개</p>
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
        <Link href="/teacher/session" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-6 text-center transition-colors shadow-sm">
          <div className="text-3xl mb-2">▶️</div>
          <div className="font-semibold">세션 시작</div>
        </Link>
        <Link href="/teacher/quizzes" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center transition-colors shadow-sm">
          <div className="text-3xl mb-2">📝</div>
          <div className="font-semibold text-gray-700">퀴즈 만들기</div>
        </Link>
        <Link href="/teacher/students" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center transition-colors shadow-sm">
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold text-gray-700">학생 관리</div>
        </Link>
      </div>

      {/* 최근 세션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">최근 세션 <span className="text-xs text-gray-400 font-normal ml-1">클릭하면 상세 보기</span></h3>
        </div>
        {recentSessions.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentSessions.map(s => (
              <li
                key={s.id}
                onClick={() => openDetail(s.id)}
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{s.quizzes?.title ?? '(삭제된 퀴즈)'}</p>
                  <p className="text-sm text-gray-400">코드: {s.code} · {new Date(s.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[s.status]}`}>
                  {statusLabel[s.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-center text-gray-400">아직 진행한 세션이 없습니다.</p>
        )}
      </div>

      {/* 세션 상세 모달 */}
      {(loading || detail) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setDetail(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {loading ? (
              <div className="p-12 text-center text-gray-400">불러오는 중...</div>
            ) : detail && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{detail.session.quizTitle}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      코드: {detail.session.code} · {new Date(detail.session.createdAt).toLocaleDateString('ko-KR')} · 문제 {detail.session.totalQuestions}개
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => exportExcel(detail)}
                      className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-medium transition-colors"
                    >
                      엑셀 저장
                    </button>
                    <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {detail.participants.length === 0 ? (
                    <p className="p-8 text-center text-gray-400">참가한 학생이 없습니다.</p>
                  ) : (
                    <>
                      {/* 요약 */}
                      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 text-sm text-gray-500">
                        <span>참가 <strong className="text-gray-700">{detail.participants.length}명</strong></span>
                        <span>평균 정답률 <strong className="text-gray-700">
                          {Math.round(detail.participants.reduce((s, p) => s + p.accuracy, 0) / detail.participants.length)}%
                        </strong></span>
                        <span>최고 점수 <strong className="text-indigo-600">{Math.max(...detail.participants.map(p => p.pointsEarned))}P</strong></span>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                            <th className="px-6 py-3">순위</th>
                            <th className="px-6 py-3">이름</th>
                            <th className="px-6 py-3">반</th>
                            <th className="px-6 py-3">정답/응답</th>
                            <th className="px-6 py-3">정답률</th>
                            <th className="px-6 py-3">획득 점수</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {detail.participants.map((p, i) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3.5">
                                <span className={`font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-medium text-gray-800">{p.name}</td>
                              <td className="px-6 py-3.5 text-gray-500">{p.className ?? '-'}</td>
                              <td className="px-6 py-3.5 text-gray-600">{p.correct}/{p.answered}</td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${p.accuracy}%` }} />
                                  </div>
                                  <span className="text-gray-600">{p.accuracy}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-indigo-600">{p.pointsEarned}P</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
