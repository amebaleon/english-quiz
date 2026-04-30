import { createClient } from '@/lib/supabase/server'
import SessionClient from './SessionClient'

export default async function SessionPage() {
  const supabase = await createClient()

  const [{ data: quizzes }, { data: activeSession }] = await Promise.all([
    supabase
      .from('quizzes')
      .select('id, title, questions(count)')
      .order('created_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('id, quiz_id, code, status, current_question_index, exam_mode, quizzes(title)')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <SessionClient
      quizzes={quizzes ?? []}
      initialSession={activeSession ?? null}
    />
  )
}
