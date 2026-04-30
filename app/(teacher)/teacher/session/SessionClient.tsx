'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useToast } from '@/lib/hooks/useToast'

interface Quiz { id: string; title: string; questions: { count: number }[] }
interface Session {
  id: string; quiz_id: string; code: string
  status: string; current_question_index: number
  quizzes: { title: string } | { title: string }[] | null
}
interface Question {
  id: string; type: 'multiple' | 'short'; content: string
  options: string[] | null; answer: string; points: number; order_index: number
}
interface Answer {
  id: string; content: string; is_correct: boolean | null
  student_id: string; users: { name: string } | null
}
interface Participant { student_id: string; users: { name: string } | null }

interface Props {
  quizzes: Quiz[]
  initialSession: Session | null
}

type Phase = 'idle' | 'waiting' | 'question' | 'revealed' | 'finished'

export default function SessionClient({ quizzes, initialSession }: Props) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [phase, setPhase] = useState<Phase>(
    initialSession
      ? initialSession.status === 'waiting' ? 'waiting'
        : initialSession.status === 'active' ? 'question'
        : 'finished'
      : 'idle'
  )
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const { toast, showToast, clearToast } = useToast()
  const [gradingAnswerId, setGradingAnswerId] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // 참가자 목록 로드
  const loadParticipants = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/teacher/sessions/${sessionId}/participants`)
    const json = await res.json()
    if (json.success) setParticipants(json.data ?? [])
  }, [])

  // 현재 문제 답변 로드
  const loadAnswers = useCallback(async (sessionId: string, questionId: string) => {
    const res = await fetch(`/api/teacher/sessions/${sessionId}/answers?question_id=${questionId}`)
    const json = await res.json()
    if (json.success) setAnswers(json.data)
  }, [])

  // 퀴즈 문제 목록 로드
  const loadQuestions = useCallback(async (quizId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index')
    setQuestions(data ?? [])
    return data ?? []
  }, [supabase])

  // Realtime 구독 설정
  const setupRealtime = useCallback((sessionId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase.channel(`teacher-session:${sessionId}`)

    // 참가자 실시간 업데이트
    ch.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'session_participants',
      filter: `session_id=eq.${sessionId}`,
    }, () => loadParticipants(sessionId))

    // 답변 실시간 업데이트
    ch.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'answers',
      filter: `session_id=eq.${sessionId}`,
    }, async (payload) => {
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', payload.new.student_id)
        .single()

      setAnswers(prev => {
        if (prev.some(a => a.id === payload.new.id)) return prev
        return [...prev, {
          id: payload.new.id,
          content: payload.new.content,
          is_correct: payload.new.is_correct,
          student_id: payload.new.student_id,
          users: user ?? null,
        }]
      })
    })

    // 채점 업데이트
    ch.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'answers',
      filter: `session_id=eq.${sessionId}`,
    }, (payload) => {
      setAnswers(prev => prev.map(a =>
        a.id === payload.new.id ? { ...a, is_correct: payload.new.is_correct } : a
      ))
    })

    ch.subscribe()
    channelRef.current = ch
  }, [supabase, loadParticipants])

  useEffect(() => { setOrigin(window.location.origin) }, [])

  // 초기 세션 복원
  useEffect(() => {
    if (!initialSession) return
    loadParticipants(initialSession.id)
    loadQuestions(initialSession.quiz_id).then(qs => {
      if (initialSession.current_question_index >= 0) {
        const q = qs[initialSession.current_question_index]
        if (q) {
          setCurrentQ(q)
          loadAnswers(initialSession.id, q.id)
        }
      }
    })
    setupRealtime(initialSession.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [supabase])

  // Realtime 누락 대비 폴링 fallback (3초)
  useEffect(() => {
    if (!session || phase === 'idle' || phase === 'finished') return
    const id = setInterval(() => {
      loadParticipants(session.id)
      if ((phase === 'question' || phase === 'revealed') && currentQ) {
        loadAnswers(session.id, currentQ.id)
      }
    }, 3000)
    return () => clearInterval(id)
  }, [session, phase, currentQ, loadParticipants, loadAnswers])

  // 세션 시작
  async function handleStartSession() {
    if (!selectedQuizId) { showToast('퀴즈를 선택하세요.', 'error'); return }
    setLoading(true)
    const res = await fetch('/api/teacher/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: selectedQuizId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.success) { showToast(json.error, 'error'); return }

    const newSession = json.data
    setSession(newSession)
    setPhase('waiting')
    setAnswers([])
    setParticipants([])
    await loadQuestions(newSession.quiz_id)
    await loadParticipants(newSession.id)
    setupRealtime(newSession.id)
  }

  // 첫 문제 공개
  async function handleStartQuiz() {
    if (!session || questions.length === 0) return
    setLoading(true)
    await fetch(`/api/teacher/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', current_question_index: 0 }),
    })
    const q = questions[0]
    setCurrentQ(q)
    setSession(prev => prev ? { ...prev, status: 'active', current_question_index: 0 } : prev)
    setAnswers([])
    setPhase('question')
    setLoading(false)
  }

  // 정답 공개 + 포인트 지급 (객관식)
  async function handleReveal() {
    if (!session || !currentQ) return
    setLoading(true)

    const statusPromise = fetch(`/api/teacher/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'revealed' }),
    })

    if (currentQ.type === 'multiple') {
      const awardPromise = fetch(`/api/teacher/sessions/${session.id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQ.id,
          correct_answer: currentQ.answer,
          points: currentQ.points,
        }),
      })
      await Promise.all([statusPromise, awardPromise])
      loadAnswers(session.id, currentQ.id) // 비동기, 결과 대기 안 함
    } else {
      await statusPromise
    }

    setPhase('revealed')
    setLoading(false)
  }

  // 주관식 수동 채점
  async function handleGrade(answer: Answer, is_correct: boolean) {
    if (!session || !currentQ) return
    setGradingAnswerId(answer.id)
    await fetch(`/api/teacher/sessions/${session.id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer_id: answer.id,
        is_correct,
        points: is_correct ? currentQ.points : 0,
        student_id: answer.student_id,
        question_id: currentQ.id,
      }),
    })
    setAnswers(prev => prev.map(a => a.id === answer.id ? { ...a, is_correct } : a))
    setGradingAnswerId(null)
  }

  // 다음 문제
  async function handleNextQuestion() {
    if (!session) return
    const nextIdx = (session.current_question_index ?? 0) + 1
    if (nextIdx >= questions.length) {
      // 세션 종료
      await fetch(`/api/teacher/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' }),
      })
      setPhase('finished')
      return
    }
    setLoading(true)
    await fetch(`/api/teacher/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', current_question_index: nextIdx }),
    })
    const q = questions[nextIdx]
    setCurrentQ(q)
    setSession(prev => prev ? { ...prev, current_question_index: nextIdx } : prev)
    setAnswers([])
    setPhase('question')
    setLoading(false)
  }

  // 세션 강제 종료
  async function handleEndSession() {
    if (!session || !confirm('세션을 종료할까요?')) return
    await fetch(`/api/teacher/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finished' }),
    })
    setPhase('finished')
  }

  // 새 세션 준비
  function handleReset() {
    setSession(null)
    setPhase('idle')
    setCurrentQ(null)
    setAnswers([])
    setParticipants([])
    setQuestions([])
    setSelectedQuizId('')
  }

  const qIdx = session?.current_question_index ?? -1
  const submittedCount = answers.length
  const correctCount = answers.filter(a => a.is_correct === true).length
  const notSubmitted = participants.filter(p => !answers.some(a => a.student_id === p.student_id))

  // ── 렌더링 ─────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">세션 시작</h2>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-500 mb-2">퀴즈가 없습니다.</p>
            <p className="text-sm text-gray-400">먼저 퀴즈를 만들어 주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(quiz => {
              const count = quiz.questions?.[0]?.count ?? 0
              return (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuizId(quiz.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-colors ${
                    selectedQuizId === quiz.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{quiz.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{count}문제</p>
                  </div>
                  {selectedQuizId === quiz.id && (
                    <span className="text-indigo-600 text-xl">✓</span>
                  )}
                </button>
              )
            })}

            <button
              onClick={handleStartSession}
              disabled={!selectedQuizId || loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-lg rounded-2xl transition-colors mt-2"
            >
              {loading ? '세션 생성 중...' : '▶ 세션 시작'}
            </button>
          </div>
        )}

        {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">세션 완료!</h2>
          <p className="text-gray-500 mb-6">참가자 {participants.length}명 · {questions.length}문제</p>
          <button onClick={handleReset} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors">
            새 세션 시작
          </button>
        </div>
        {session && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-600">참가자 결과 (대시보드에서 상세 확인)</div>
            <ul className="divide-y divide-gray-50">
              {participants.length === 0 ? (
                <li className="px-6 py-6 text-center text-gray-400 text-sm">참가자 없음</li>
              ) : participants.map((p, i) => {
                const name = (p.users as any)?.name ?? '알 수 없음'
                return (
                  <li key={p.student_id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{name}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* 왼쪽: 세션 코드 + 참가자 */}
      <div className="w-72 shrink-0 space-y-4">
        {/* 코드 카드 */}
        <div className="bg-indigo-600 text-white rounded-2xl p-6 text-center shadow-lg">
          <p className="text-indigo-200 text-sm font-medium mb-2">입장 코드</p>
          <p className="text-5xl font-black tracking-widest">{session?.code}</p>
          <p className="text-indigo-200 text-xs mt-3">학생에게 이 코드를 알려주세요</p>
          {session?.code && (
            <div className="mt-4 bg-white rounded-xl p-2 inline-block">
              <img
                src={origin ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  `${origin}/student/join?code=${session.code}`
                )}` : undefined}
                alt="QR코드"
                width={120}
                height={120}
              />
            </div>
          )}
        </div>

        {/* 진행 상태 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">진행</p>
          <p className="text-lg font-bold text-gray-800">
            {phase === 'waiting' ? '대기 중' : `${qIdx + 1} / ${questions.length} 문제`}
          </p>
        </div>

        {/* 참가자 목록 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">참가자</p>
            <span className="text-sm font-bold text-indigo-600">{participants.length}명</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">학생 입장 대기 중...</p>
            ) : participants.map(p => (
              <div key={p.student_id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                <span className="text-gray-700">{(p.users as any)?.name ?? '알 수 없음'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 세션 종료 버튼 */}
        {(phase === 'waiting' || phase === 'question' || phase === 'revealed') && (
          <button
            onClick={handleEndSession}
            className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors"
          >
            세션 종료
          </button>
        )}
      </div>

      {/* 오른쪽: 문제 + 답변 */}
      <div className="flex-1 space-y-4">

        {/* 대기 중 */}
        {phase === 'waiting' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-4xl mb-4">⏳</p>
            <h3 className="text-xl font-bold text-gray-800 mb-2">학생 입장 대기 중</h3>
            <p className="text-gray-400 mb-6">{participants.length}명 입장 완료</p>
            <button
              onClick={handleStartQuiz}
              disabled={loading || questions.length === 0}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-lg rounded-2xl transition-colors"
            >
              {loading ? '시작 중...' : '퀴즈 시작!'}
            </button>
            {questions.length === 0 && (
              <p className="text-red-400 text-sm mt-3">이 퀴즈에 문제가 없습니다.</p>
            )}
          </div>
        )}

        {/* 문제 진행 중 */}
        {(phase === 'question' || phase === 'revealed') && currentQ && (
          <>
            {/* 문제 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
                  {qIdx + 1}번 문제
                </span>
                <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">
                  {currentQ.points}P
                </span>
                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                  {currentQ.type === 'multiple' ? '객관식' : '주관식'}
                </span>
                <span className="ml-auto text-sm text-gray-400">
                  {submittedCount}명 제출 / {participants.length}명 참가
                </span>
              </div>

              <p className="text-xl font-semibold text-gray-800 leading-relaxed mb-4">
                {currentQ.content}
              </p>

              {/* 객관식 보기 */}
              {currentQ.type === 'multiple' && currentQ.options && (
                <div className="grid grid-cols-2 gap-2">
                  {currentQ.options.map((opt, i) => (
                    <div key={i} className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      phase === 'revealed' && currentQ.answer === String(i)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}>
                      <span className="font-bold mr-2">{i + 1}.</span>{opt}
                      {phase === 'revealed' && currentQ.answer === String(i) && (
                        <span className="ml-2">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 주관식 정답 (공개 시만) */}
              {phase === 'revealed' && currentQ.type === 'short' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-xs font-semibold text-emerald-600 block mb-0.5">참고 정답</span>
                  <span className="text-emerald-700 font-medium">{currentQ.answer}</span>
                </div>
              )}
            </div>

            {/* 답변 현황 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">답변 현황</h4>
                <div className="text-right">
                  {phase === 'revealed' && submittedCount > 0 && (
                    <p className="text-sm font-semibold text-emerald-600">
                      정답 {correctCount}명 ({Math.round(correctCount / submittedCount * 100)}%) / {submittedCount}명 제출
                    </p>
                  )}
                  {phase === 'question' && notSubmitted.length > 0 && (
                    <p className="text-xs text-amber-500">미제출 {notSubmitted.length}명: {notSubmitted.map(p => (p.users as any)?.name).join(', ')}</p>
                  )}
                </div>
              </div>

              {answers.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">아직 제출한 학생이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {answers.map(answer => {
                    const name = (answer.users as any)?.name ?? '알 수 없음'
                    const isRevealed = phase === 'revealed'
                    const isCorrect = answer.is_correct

                    return (
                      <div key={answer.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                        isRevealed
                          ? isCorrect === true ? 'border-emerald-200 bg-emerald-50'
                            : isCorrect === false ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg ${
                            isRevealed
                              ? isCorrect === true ? '✅' : isCorrect === false ? '❌' : '⏳'
                              : '📝'
                          }`}>
                            {isRevealed ? (isCorrect === true ? '✅' : isCorrect === false ? '❌' : '⏳') : '📝'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{name}</p>
                            {currentQ.type === 'short' && (
                              <p className="text-xs text-gray-500">{answer.content}</p>
                            )}
                            {currentQ.type === 'multiple' && isRevealed && (
                              <p className="text-xs text-gray-500">
                                선택: {currentQ.options?.[parseInt(answer.content)] ?? answer.content}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 주관식: 수동 채점 버튼 */}
                        {currentQ.type === 'short' && phase === 'revealed' && isCorrect === null && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGrade(answer, true)}
                              disabled={gradingAnswerId === answer.id}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-bold disabled:opacity-50"
                            >
                              O 정답
                            </button>
                            <button
                              onClick={() => handleGrade(answer, false)}
                              disabled={gradingAnswerId === answer.id}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-bold disabled:opacity-50"
                            >
                              X 오답
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex gap-3">
              {phase === 'question' && (
                <>
                  <button
                    onClick={handleReveal}
                    disabled={loading}
                    className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-lg rounded-2xl transition-colors"
                  >
                    {loading ? '처리 중...' : '정답 공개'}
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={loading}
                    title="채점 없이 다음 문제로"
                    className="px-5 py-4 border-2 border-gray-300 text-gray-500 hover:bg-gray-50 font-semibold rounded-2xl transition-colors text-sm"
                  >
                    건너뛰기
                  </button>
                </>
              )}
              {phase === 'revealed' && (
                <button
                  onClick={handleNextQuestion}
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-lg rounded-2xl transition-colors"
                >
                  {loading ? '이동 중...' : qIdx + 1 >= questions.length ? '세션 종료' : '다음 문제 →'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}
    </div>
  )
}
