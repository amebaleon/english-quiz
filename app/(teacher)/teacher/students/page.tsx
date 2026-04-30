import { createServiceClient } from '@/lib/supabase/server'
import StudentsClient from './StudentsClient'

export default async function StudentsPage() {
  const supabase = createServiceClient()

  const [{ data: students }, { data: classes }] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, class_id, total_points, birth_year, school, created_at, classes(id, name)')
      .eq('role', 'student')
      .order('name'),
    supabase.from('classes').select('id, name').order('name'),
  ])

  return <StudentsClient initialStudents={students ?? []} initialClasses={classes ?? []} />
}
