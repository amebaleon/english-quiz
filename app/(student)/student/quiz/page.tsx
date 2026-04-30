'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Icon, { IconName } from '@/components/ui/Icon'

interface Question {
  id: string; type: 'multiple' | 'short'
  content: string; options: string[] | null
  answer?: string; points: number; order_index: number
}
interface MyAnswer { id: string; content: string; is_correct: boolean | null }
interface SessionData {
  session: { id: string; status: string; current_question_index: number; exam_mode?: boolean }
  question: Question | null
  myAnswer: MyAnswer | null
}

// 객관식 보기 색상 (파스텔, 최대 8선지)
const OPTION = [
  { card: 'bg-rose-50   border-rose-200   hover:bg-rose-100   active:bg-rose-200',   badge: 'bg-rose-400',   label: 'text-rose-700'   },
  { card: 'bg-sky-50    border-sky-200    hover:bg-sky-100    active:bg-sky-200',    badge: 'bg-sky-500',    label: 'text-sky-700'    },
  { card: 'bg-amber-50  border-amber-200  hover:bg-amber-100  active:bg-amber-200',  badge: 'bg-amber-400',  label: 'text-amber-700'  },
  { card: 'bg-violet-50 border-violet-200 hover:bg-violet-100 active:bg-violet-200', badge: 'bg-violet-400', label: 'text-violet-700' },
  { card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200', badge: 'bg-emerald-500', label: 'text-emerald-700' },
  { card: 'bg-orange-50 border-orange-200 hover:bg-orange-100 active:bg-orange-200', badge: 'bg-orange-400', label: 'text-orange-700' },
  { card: 'bg-pink-50   border-pink-200   hover:bg-pink-100   active:bg-pink-200',   badge: 'bg-pink-400',   label: 'text-pink-700'   },
  { card: 'bg-teal-50   border-teal-200   hover:bg-teal-100   active:bg-teal-200',   badge: 'bg-teal-500',   label: 'text-teal-700'   },
]

function optionGridClass(count: number) {
  if (count <= 2) return 'grid grid-cols-2 gap-3 flex-1'
  if (count === 3) return 'grid grid-cols-1 gap-3 flex-1'
  return 'grid grid-cols-2 gap-3 flex-1'
}

function optionMinHeight(count: number) {
  if (count <= 2) return 'min-h-[140px]'
  if (count === 3) return 'min-h-[80px]'
  return 'min-h-[110px]'
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
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [showPoints, setShowPoints] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const currentQIdRef = useRef<string | null>(null)
  const prevStatusRef = useRef<string | null>(null)

  const loadQuizData = useCallback(async () => {
    if (!sessionId) return
    setTimedOut(false)
    const timeout = setTimeout(() => setTimedOut(true), 10000)
    try {
      const res = await fetch(`/api/student/quiz?session_id=${sessionId}`)
      clearTimeout(timeout)
      const json = await res.json()
      if (json.success) {
        const newData: SessionData = json.data
        const prevStatus = prevStatusRef.current
        const newStatus = newData.session.status

        // 정답 공개 시 flash
        if (prevStatus !== 'revealed' && newStatus === 'revealed') {
          const correct = newData.myAnswer?.is_correct
          if (correct === true)  { setFlash('correct'); setShowPoints(true); setTimeout(() => setShowPoints(false), 1200) }
          if (correct === false) { setFlash('wrong') }
          if (flash !== null)    setTimeout(() => setFlash(null), 700)
        }
        prevStatusRef.current = newStatus

        setData(newData)
        const q = newData.question
        const myAns = newData.myAnswer
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
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadQuizData() }, [loadQuizData])

  useEffect(() => {
    if (data?.session.status === 'finished' && sessionId && !results) {
      fetch(`/api/student/results?session_id=${sessionId}`)
        .then(r => r.json())
        .then(json => { if (json.success) setResults(json.data) })
        .catch(() => setResults([]))
    }
  }, [data?.session.status, sessionId, results])

  useEffect(() => {
    if (!sessionId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase
      .channel(`student-session:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, () => loadQuizData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` }, () => loadQuizData())
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
      body: JSON.stringify({ session_id: sessionId, question_id: data.question.id, content: answer }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (!json.success) { setError(json.error); return }
    setSubmitted(true)
    setSubmittedAnswer(answer)
  }

  // ── 잘못된 접근 ──────────────────────────────────────
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

  // ── 로딩 ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 gap-4 p-6">
        {timedOut ? (
          <>
            <Icon name="clock" size={48} className="text-gray-300" />
            <p className="text-gray-500 font-medium">연결이 느립니다</p>
            <p className="text-gray-400 text-sm">인터넷 연결을 확인해주세요</p>
            <button onClick={() => { setLoading(true); loadQuizData() }}
              className="mt-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-2xl active:scale-95 transition-all">
              다시 시도
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">불러오는 중...</p>
          </>
        )}
      </div>
    )
  }

  // ── 대기 중 ──────────────────────────────────────────
  if (!data || data.session.status === 'waiting' || data.session.current_question_index < 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6 safe-top safe-bottom text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 relative">
          <Icon name="clock" size={48} className="text-emerald-500" strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">선생님을 기다리는 중</h2>
        <p className="text-gray-400 mb-8">퀴즈가 곧 시작됩니다!</p>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── 정답 공개 ─────────────────────────────────────────
  if (data.session.status === 'revealed') {
    const q = data.question
    const myAns = data.myAnswer
    const isCorrect = myAns?.is_correct
    const notSubmitted = !myAns

    type Cfg = { iconName: IconName; iconClass: string; title: string; subtitle: string; bg: string; border: string; flashBg: string }
    let cfg: Cfg
    if (notSubmitted) {
      cfg = { iconName: 'face-sad', iconClass: 'text-gray-400', title: '미제출', subtitle: '다음엔 꼭 답변해요!', bg: 'bg-gray-50', border: 'border-gray-200', flashBg: '' }
    } else if (isCorrect === true) {
      cfg = { iconName: 'sparkles', iconClass: 'text-emerald-500', title: '정답!', subtitle: `+${q?.points ?? 0}P 획득`, bg: 'bg-emerald-50', border: 'border-emerald-300', flashBg: 'bg-emerald-200' }
    } else if (isCorrect === false) {
      cfg = { iconName: 'x-circle', iconClass: 'text-red-400', title: '틀렸어요', subtitle: '다음엔 잘 할 수 있어요!', bg: 'bg-red-50', border: 'border-red-200', flashBg: 'bg-red-200' }
    } else {
      cfg = { iconName: 'clock', iconClass: 'text-amber-400', title: '채점 중...', subtitle: '선생님이 채점하고 있어요', bg: 'bg-amber-50', border: 'border-amber-200', flashBg: '' }
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6 safe-top safe-bottom text-center relative overflow-hidden">
        {/* flash overlay */}
        {flash && cfg.flashBg && (
          <div className={`fixed inset-0 ${cfg.flashBg} pointer-events-none ${flash === 'correct' ? 'flash-correct' : 'flash-wrong'}`} />
        )}

        {/* 결과 카드 */}
        <div className={`w-full max-w-sm rounded-3xl border-2 ${cfg.border} ${cfg.bg} p-8 mb-5 animate-bounce-in relative`}>
          {/* 포인트 획득 float */}
          {showPoints && isCorrect === true && (
            <div className="absolute top-4 right-4 text-emerald-600 font-black text-xl animate-float-up pointer-events-none">
              +{q?.points}P
            </div>
          )}
          <div className="flex justify-center mb-4">
            <Icon name={cfg.iconName} size={72} className={cfg.iconClass} strokeWidth={1} />
          </div>
          <h2 className={`text-3xl font-black mb-1 ${isCorrect === true ? 'text-emerald-700' : isCorrect === false ? 'text-red-600' : 'text-gray-800'}`}>
            {cfg.title}
          </h2>
          <p className={`text-sm font-semibold ${isCorrect === true ? 'text-emerald-600' : 'text-gray-400'}`}>{cfg.subtitle}</p>
        </div>

        {/* 정답 표시 */}
        {q?.answer && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-5 animate-fade-in">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">정답</p>
            {q.type === 'multiple' && q.options ? (
              <p className="font-black text-emerald-600 text-lg">
                {parseInt(q.answer) + 1}번 · {q.options[parseInt(q.answer)]}
              </p>
            ) : (
              <p className="font-black text-emerald-600 text-lg">{q.answer}</p>
            )}
          </div>
        )}

        <div className="flex gap-1.5 mt-8">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <p className="text-gray-300 text-xs mt-2">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // ── 세션 종료 ─────────────────────────────────────────
  if (data.session.status === 'finished') {
    const me = results?.find(r => r.isMe)
    const myRank = results ? results.findIndex(r => r.isMe) + 1 : 0
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 safe-top safe-bottom">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-center py-10 px-6 header-wave">
          <div className="flex justify-center mb-3">
            <Icon name="trophy" size={56} className="text-white" strokeWidth={1} />
          </div>
          <h2 className="text-2xl font-black mb-1">퀴즈 종료!</h2>
          <p className="text-emerald-100 text-sm">수고했어요!</p>
        </div>

        {me && (
          <div className="mx-5 -mt-5 bg-white rounded-2xl border-2 border-emerald-300 p-5 text-center shadow-md animate-bounce-in">
            <p className="text-xs text-gray-400 mb-1">내 결과</p>
            <p className="text-5xl font-black text-indigo-600 mb-1">{myRank}등</p>
            <p className="text-gray-500 text-sm">
              {me.correct}/{me.total} 정답 ·{' '}
              <span className="font-black text-indigo-500">+{me.pts}P</span>
            </p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="mx-5 mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="font-bold text-gray-700 text-sm">전체 순위</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {results.slice(0, 10).map((r, i) => {
                const rankColor = i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-amber-500' : 'bg-gray-100'
                const rankText = i < 3 ? 'text-white' : 'text-gray-500'
                return (
                  <li key={r.student_id} className={`flex items-center gap-3 px-5 py-3 ${r.isMe ? 'bg-indigo-50' : ''}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankColor} ${rankText}`}>{i+1}</span>
                    <span className={`flex-1 font-medium text-sm ${r.isMe ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>
                      {r.name}{r.isMe && <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-500 px-1.5 py-0.5 rounded-full">나</span>}
                    </span>
                    <span className="text-sm font-bold text-indigo-500">{r.pts}P</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="mx-5 mt-4 mb-8">
          <Link href="/student/home"
            className="block w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center rounded-2xl active:scale-[0.98] transition-all">
            홈으로
          </Link>
        </div>
      </div>
    )
  }

  const q = data.question

  // ── 다음 문제 대기 ────────────────────────────────────
  if (!q) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Icon name="clock" size={32} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <p className="text-gray-500 font-medium">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // ── 백지시험 제출 완료 ────────────────────────────────
  if (submitted && data.session.exam_mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 p-6 safe-top safe-bottom text-center">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5 animate-bounce-in">
          <Icon name="check-circle" size={44} className="text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-white mb-1 animate-fade-in">제출 완료!</h2>
        <p className="text-gray-400 text-sm mb-4">선생님의 채점을 기다리세요</p>
        <div className="bg-white/10 rounded-xl px-5 py-3 mb-8">
          <span className="text-gray-300 text-xs font-bold">내 답변 · </span>
          <span className="text-white font-semibold">{submittedAnswer}</span>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2">다음 문제를 기다리는 중...</p>
      </div>
    )
  }

  // ── 제출 완료 대기 ────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-6 safe-top safe-bottom text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 animate-bounce-in">
          <Icon name="check-circle" size={44} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-1 animate-fade-in">제출 완료!</h2>
        <p className="text-gray-400 text-sm mb-6">선생님의 채점을 기다리세요</p>

        <div className="w-full max-w-xs bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-slide-up">
          <p className="text-xs text-gray-400 mb-2">문제 {data.session.current_question_index + 1}</p>
          {!data.session.exam_mode && (
            <p className="text-gray-700 font-medium text-sm leading-relaxed mb-3">{q.content}</p>
          )}
          <div className="bg-emerald-50 rounded-xl px-3 py-2">
            <span className="text-xs text-emerald-500 font-bold">내 답변 · </span>
            <span className="text-emerald-700 font-semibold text-sm">
              {!data.session.exam_mode && q.type === 'multiple' && q.options
                ? q.options[parseInt(submittedAnswer)] ?? submittedAnswer
                : submittedAnswer}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-8">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
        <p className="text-gray-300 text-xs mt-2">결과 발표를 기다리는 중...</p>
      </div>
    )
  }

  // ── 백지시험 모드 ─────────────────────────────────────
  if (data.session.exam_mode) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 safe-top safe-bottom">
        <div className="bg-gray-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
              문제 {data.session.current_question_index + 1}번 진행 중
            </span>
            <span className="bg-white/10 text-gray-300 text-xs px-3 py-1 rounded-full">백지시험</span>
          </div>
        </div>

        {error && (
          <p className="mx-5 mt-4 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex-1 px-5 py-6 flex flex-col">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="답을 입력하세요..."
            rows={5}
            className="w-full flex-1 px-5 py-4 border-2 border-gray-200 bg-white rounded-2xl focus:outline-none focus:border-gray-500 text-gray-800 text-lg resize-none"
          />
          <button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || submitting}
            className="mt-3 w-full py-5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xl rounded-2xl active:scale-[0.98] transition-all duration-75"
          >
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    )
  }

  // ── 문제 화면 ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 safe-top safe-bottom">
      {/* 헤더 */}
      <div className="bg-emerald-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
            문제 {data.session.current_question_index + 1}
          </span>
          <span className="bg-white text-emerald-600 text-sm font-black px-3 py-1 rounded-full shadow-sm">
            {q.points}P
          </span>
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="px-5 py-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {q.type === 'multiple' ? '객관식' : '주관식'}
          </span>
          <p className="text-xl font-black text-gray-800 leading-relaxed mt-2">{q.content}</p>
        </div>
      </div>

      {error && (
        <p className="mx-5 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mb-2">{error}</p>
      )}

      {/* 답변 영역 */}
      <div className="flex-1 px-5 pb-6 flex flex-col">
        {/* 객관식: 가변 파스텔 그리드 */}
        {q.type === 'multiple' && q.options && (
          <div className={optionGridClass(q.options.length)}>
            {q.options.map((opt, i) => {
              const s = OPTION[i % OPTION.length]
              return (
                <button
                  key={i}
                  onClick={() => handleSubmit(String(i))}
                  disabled={submitting}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 active:scale-[0.96] transition-all duration-75 disabled:opacity-60 ${optionMinHeight(q.options!.length)} ${s.card}`}
                >
                  <span className={`w-7 h-7 rounded-full ${s.badge} text-white text-sm font-black flex items-center justify-center shrink-0`}>
                    {i + 1}
                  </span>
                  <span className={`font-semibold text-sm leading-snug ${s.label}`}>{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 주관식 */}
        {q.type === 'short' && (
          <div className="flex flex-col flex-1">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="답을 입력하세요..."
              rows={4}
              className="w-full flex-1 px-5 py-4 border-2 border-gray-200 bg-white rounded-2xl focus:outline-none focus:border-emerald-400 text-gray-800 text-lg resize-none"
            />
            <button
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || submitting}
              className="mt-3 w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-xl rounded-2xl active:scale-[0.98] transition-all duration-75"
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
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
