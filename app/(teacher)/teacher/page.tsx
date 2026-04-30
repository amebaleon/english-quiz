import { createServiceClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function TeacherDashboard() {
  const service = createServiceClient()

  const [studentsRes, quizzesRes, sessionsRes] = await Promise.allSettled([
    service.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    service.from('quizzes').select('*', { count: 'exact', head: true }),
    service.from('sessions').select('id, code, status, created_at, quizzes(title)').order('created_at', { ascending: false }).limit(5),
  ])

  const studentCount = studentsRes.status === 'fulfilled' ? studentsRes.value.count : 0
  const quizCount = quizzesRes.status === 'fulfilled' ? quizzesRes.value.count : 0
  const recentSessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value.data : []

  return (
    <DashboardClient
      studentCount={studentCount ?? 0}
      quizCount={quizCount ?? 0}
      recentSessions={(recentSessions as any) ?? []}
    />
  )
}
