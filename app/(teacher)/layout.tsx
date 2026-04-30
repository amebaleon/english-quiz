import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/teacher/login')

  return (
    <div className="flex h-screen bg-gray-100">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto animate-page-enter">
        {children}
      </main>
    </div>
  )
}
