import { createServiceClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function TeacherDashboard() {
  const service = createServiceClient()

  const [
    { count: studentCount },
    { count: quizCount },
    { data: recentSessions },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    service.from('quizzes').select('*', { count: 'exact', head: true }),
    service.from('sessions').select('id, code, status, created_at, quizzes(title)').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <DashboardClient
      studentCount={studentCount ?? 0}
      quizCount={quizCount ?? 0}
      recentSessions={(recentSessions as any) ?? []}
    />
  )
}
