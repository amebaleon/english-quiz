import type { SupabaseClient } from '@supabase/supabase-js'

export async function cleanupStudentAnswers(service: SupabaseClient, studentId: string) {
  const { data } = await service
    .from('answers')
    .select('id')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
    .range(100, 99999)
  if (data?.length) {
    await service.from('answers').delete().in('id', data.map(r => r.id))
  }
}

export async function cleanupStudentPoints(service: SupabaseClient, studentId: string) {
  const { data } = await service
    .from('points_history')
    .select('id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .range(200, 99999)
  if (data?.length) {
    await service.from('points_history').delete().in('id', data.map(r => r.id))
  }
}
