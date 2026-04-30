import { createClient } from '@/lib/supabase/server'
import QuizzesClient from './QuizzesClient'

export default async function QuizzesPage() {
  const supabase = await createClient()
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, category, created_at, questions(count)')
    .order('created_at', { ascending: false })

  return <QuizzesClient initialQuizzes={quizzes ?? []} />
}
