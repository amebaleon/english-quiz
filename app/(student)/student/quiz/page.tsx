'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Question {
  id: string; type: 'multiple' | 'short'
  content: string; options: string[] | null
  answer?: string; points: number; order_index: number
}
interface MyAnswer { id: string; content: string; is_correct: boolean | null }
interface SessionData {
  session: { id: string; status: string; current_question_index: number }
  question: Question | null
  myAnswer: MyAnswer | null
}

function QuizContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [data, setData] = useState<SessionData | null>(null)
  const [input, setInput] = useState('')
  const [submittedAnswer, setSubmittedAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [timedOut, setTimedOut] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const currentQIdRef = useRef<string | null>(null)

  const loadQuizData = useCallback(async () => {
    if (!sessionId) return
    setTimedOut(false)
    const timeout = setTimeout(() => setTimedOut(true), 10000)
    try {
      const res = await fetch(`/api/student/quiz?session_id=${sessionId}`)
      clearTimeout(timeout)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        const q = json.data.question
        const myAns = json.data.myAnswer
        if (q && q.id !== currentQIdRef.current) {
          currentQIdRef.current = q.id
          setSubmitted(!!myAns)
          setSubmittedAnswer(myAns?.content ?? '')
          setInput('')
          setError('')
        } else if (myAns) {
          setSubmitted(true)
          setSubmittedAnswer(prev => prev || myAns.content)
        }
      }
    } catch {
      clearTimeout(timeout)
      setTimedOut(true)
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    loadQuizData()
  }, [loadQuizData])

  // 세션 종료 시 결과 fetch
  useEffect(() => {
    if (data?.session.status === 'finished' && sessionId && !results) {
      fetch(`/api/student/results?session_id=${sessionId}`)
        .then(r => r.json())
        .then(json => { if (json.success) setResults(json.data) })
        .catch(() => setResults([]))
    }
  }, [data?.session.status, sessionId, results])

  // Realtime: 세션 상태 변화 구독
  useEffect(() => {
    if (!sessionId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`student-session:${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, () => loadQuizData())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${sessionId}`,
      }, () => loadQuizData())
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [sessionId, supabase, loadQuizData])

  async function handleSubmit(answer: string) {
    if (!data?.question || submitting) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/student/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: data.question.id,
        content: answer,
      }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (!json.success) { setError(json.error); return }
    setSubmitted(true)
    setSubmittedAnswer(answer)
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">잘못된 접근입니다.</p>
          <Link href="/student/join" className="text-emerald-600 underline">세션 코드 입력으로</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 gap-4">
        {timedOut ? (
          <>
            <p className="text-gray-500 text-lg">연결이 느립니다</p>
            <p className="text-gray-400 text-sm">인터넷 연결을 확인해주세요</p>
            <button
              onClick={() => { setLoading(true); loadQuizData() }}
              className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-2xl"
            >
              다시 시도
            </button>
          </>
        ) : (
          <p className="text-gray-400 text-lg animate-pulse">불러오는 중...</p>
        )}
      </div>
    )
  }

  // 세션 대기 중
  if (!data || data.session.status === 'waiting' || data.session.current_question_index < 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom text-center">
        <div className="text-6xl mb-6 animate-pulse">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">선생님을 기다리는 중</h2>
        <p className="text-gray-500">퀴즈가 곧 시작됩니다!</p>
      </div>
    )
  }

  // 정답 공개 화면
  if (data.session.status === 'revealed') {
    const q = data.question
    const myAns = data.myAnswer
    const isCorrect = myAns?.is_correct
    const notSubmitted = !myAns

    let icon: string, title: string, subtitle: string, bg: string, border: string
    if (notSubmitted) {
      icon = '😢'; title = '미제출'; subtitle = '다음엔 꼭 답변해요!'
      bg = 'bg-gray-50'; border = 'border-gray-200'
    } else if (isCorrect === true) {
      icon = '🎉'; title = '정답!'; subtitle = `+${q?.points ?? 0}P 획득`
      bg = 'bg-emerald-50'; border = 'border-emerald-300'
    } else if (isCorrect === false) {
      icon = '❌'; title = '틀렸어요'; subtitle = '다음엔 잘 할 수 있어요!'
      bg = 'bg-red-50'; border = 'border-red-200'
    } else {
      icon = '⏳'; title = '채점 중...'; subtitle = '선생님이 채점하고 있어요'
      bg = 'bg-amber-50'; border = 'border-amber-200'
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom text-center">
        <div className={`w-full max-w-sm rounded-2xl border-2 ${border} ${bg} p-8 mb-6`}>
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>

        {q?.answer && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">정답</p>
            {q.type === 'multiple' && q.options ? (
              <p className="font-bold text-emerald-600 text-lg">
                {parseInt(q.answer) + 1}번. {q.options[parseInt(q.answer)]}
              </p>
            ) : (
              <p className="font-bold text-emerald-600 text-lg">{q.answer}</p>
            )}
          </div>
        )}

        <p className="text-gray-300 text-sm mt-8 animate-pulse">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // 세션 종료
  if (data.session.status === 'finished') {
    const me = results?.find(r => r.isMe)
    const myRank = results ? results.findIndex(r => r.isMe) + 1 : 0
    return (
      <div className="min-h-screen flex flex-col bg-emerald-50 safe-top safe-bottom">
        <div className="bg-emerald-500 text-white text-center py-8 px-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-1">퀴즈 종료!</h2>
          <p className="text-emerald-100">수고했어요!</p>
        </div>

        {me && (
          <div className="mx-4 mt-4 bg-white rounded-2xl border-2 border-emerald-300 p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">내 결과</p>
            <p className="text-4xl font-black text-indigo-600 mb-1">{myRank}등</p>
            <p className="text-gray-600 text-sm">{me.correct}/{me.total} 정답 · <span className="font-bold text-indigo-500">{me.pts}P</span> 획득</p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-700 text-sm">전체 순위</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {results.slice(0, 10).map((r, i) => (
                <li key={r.student_id} className={`flex items-center gap-3 px-5 py-3 ${r.isMe ? 'bg-indigo-50' : ''}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className={`flex-1 font-medium text-sm ${r.isMe ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {r.name}{r.isMe && ' (나)'}
                  </span>
                  <span className="text-sm font-bold text-indigo-600">{r.pts}P</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mx-4 mt-4">
          <Link href="/student/profile" className="block w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center rounded-2xl transition-colors">
            내 포인트 확인
          </Link>
        </div>
      </div>
    )
  }

  const q = data.question
  if (!q) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6">
        <div className="animate-pulse text-5xl mb-4">⏳</div>
        <p className="text-gray-500">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // 제출 완료 대기 화면
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 safe-top safe-bottom text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">제출 완료!</h2>
        <p className="text-gray-500 mb-6">선생님의 채점을 기다리세요</p>
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 max-w-xs w-full">
          <p className="text-xs text-gray-400 mb-1">{data.session.current_question_index + 1}번 문제</p>
          <p className="text-gray-700 font-medium text-sm leading-relaxed">{q.content}</p>
          <p className="mt-3 text-indigo-600 font-semibold text-sm">
            내 답변: {q.type === 'multiple' && q.options
              ? q.options[parseInt(submittedAnswer)] ?? submittedAnswer
              : submittedAnswer}
          </p>
        </div>
        <p className="text-gray-300 text-sm mt-8 animate-pulse">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // 문제 화면
  return (
    <div className="min-h-screen flex flex-col bg-white safe-top safe-bottom">
      {/* 헤더 */}
      <div className="bg-emerald-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-emerald-100 text-sm">문제 {data.session.current_question_index + 1}</span>
          <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {q.points}P
          </span>
        </div>
      </div>

      {/* 문제 내용 */}
      <div className="px-6 py-6 flex-1 flex flex-col">
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <p className="text-xl font-bold text-gray-800 leading-relaxed">{q.content}</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {/* 객관식 */}
        {q.type === 'multiple' && q.options && (
          <div className="space-y-3 flex-1">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(String(i))}
                disabled={submitting}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 rounded-2xl transition-colors text-left disabled:opacity-60"
              >
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-lg">
                  {i + 1}
                </span>
                <span className="text-gray-800 font-medium text-lg">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* 주관식 */}
        {q.type === 'short' && (
          <div className="flex-1 flex flex-col">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="답을 입력하세요..."
              rows={4}
              className="w-full flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-400 text-gray-800 text-lg resize-none"
            />
            <button
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || submitting}
              className="mt-4 w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xl rounded-2xl transition-colors"
            >
              {submitting ? '제출 중...' : '제출하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
