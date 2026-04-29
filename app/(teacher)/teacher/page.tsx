import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const [
    { count: studentCount },
    { count: quizCount },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('id, code, status, created_at, quizzes(title)').order('created_at', { ascending: false }).limit(5),
  ])

  const statusLabel: Record<string, string> = {
    waiting: '대기 중',
    active: '진행 중',
    finished: '완료',
  }
  const statusColor: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    finished: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">전체 학생</p>
          <p className="text-4xl font-bold text-indigo-600">{studentCount ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">명</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">퀴즈 세트</p>
          <p className="text-4xl font-bold text-indigo-600">{quizCount ?? 0}</p>
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
          <h3 className="font-semibold text-gray-700">최근 세션</h3>
        </div>
        {recentSessions && recentSessions.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentSessions.map((s: any) => (
              <li key={s.id} className="px-6 py-4 flex items-center justify-between">
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
    </div>
  )
}
