'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import QuestionForm, { QuestionDraft } from './QuestionForm'

interface Question {
  id: string
  type: 'multiple' | 'short'
  content: string
  options: string[] | null
  answer: string
  points: number
  order_index: number
}

interface Quiz { id: string; title: string }

interface Props {
  quiz: Quiz
  onClose: () => void
  onTitleUpdated: (title: string) => void
}

type Panel = 'list' | 'add' | 'edit'

export default function QuizEditorModal({ quiz, onClose, onTitleUpdated }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<Panel>('list')
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [titleEdit, setTitleEdit] = useState(false)
  const [newTitle, setNewTitle] = useState(quiz.title)

  useEffect(() => { loadQuestions() }, [quiz.id])

  async function loadQuestions() {
    setLoading(true)
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}/questions`)
    const json = await res.json()
    setLoading(false)
    if (json.success) setQuestions(json.data)
  }

  async function handleSaveTitle() {
    if (!newTitle.trim()) return
    await fetch(`/api/teacher/quizzes/${quiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    onTitleUpdated(newTitle)
    setTitleEdit(false)
  }

  async function handleAddQuestion(draft: QuestionDraft) {
    setError('')
    setSaving(true)
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.success) { setError(json.error); return }
    setQuestions(prev => [...prev, json.data])
    setPanel('list')
  }

  async function handleEditQuestion(draft: QuestionDraft) {
    if (!editTarget) return
    setError('')
    setSaving(true)
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}/questions/${editTarget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.success) { setError(json.error); return }
    setQuestions(prev => prev.map(q => q.id === editTarget.id ? { ...q, ...draft } : q))
    setPanel('list')
    setEditTarget(null)
  }

  async function handleDeleteQuestion(q: Question) {
    if (!confirm('이 문제를 삭제할까요?')) return
    await fetch(`/api/teacher/quizzes/${quiz.id}/questions/${q.id}`, { method: 'DELETE' })
    setQuestions(prev => prev.filter(x => x.id !== q.id))
  }

  async function handleMoveQuestion(q: Question, dir: -1 | 1) {
    const idx = questions.findIndex(x => x.id === q.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= questions.length) return

    const newList = [...questions]
    const temp = newList[idx].order_index
    newList[idx] = { ...newList[idx], order_index: newList[swapIdx].order_index }
    newList[swapIdx] = { ...newList[swapIdx], order_index: temp }
    ;[newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]]
    setQuestions(newList)

    await Promise.all([
      fetch(`/api/teacher/quizzes/${quiz.id}/questions/${newList[idx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newList[idx].order_index }),
      }),
      fetch(`/api/teacher/quizzes/${quiz.id}/questions/${newList[swapIdx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newList[swapIdx].order_index }),
      }),
    ])
  }

  const typeLabel = { multiple: '객관식', short: '주관식' }
  const typeColor = { multiple: 'bg-blue-50 text-blue-600', short: 'bg-purple-50 text-purple-600' }

  return (
    <Modal title="" onClose={onClose} size="lg">
      {/* 퀴즈 제목 헤더 */}
      <div className="flex items-center gap-3 mb-6 -mt-2">
        {titleEdit ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle() }}
              autoFocus
              className="flex-1 px-3 py-1.5 border border-indigo-400 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={handleSaveTitle} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">저장</button>
            <button onClick={() => { setTitleEdit(false); setNewTitle(quiz.title) }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-500">취소</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h3 className="text-xl font-bold text-gray-800">{newTitle}</h3>
            <button onClick={() => setTitleEdit(true)} className="text-gray-400 hover:text-indigo-500 text-sm">✏️</button>
          </div>
        )}
        <span className="text-sm text-gray-400">{questions.length}문제</span>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>}

      {panel === 'list' && (
        <>
          {loading ? (
            <p className="text-center text-gray-400 py-12">불러오는 중...</p>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">아직 문제가 없습니다.</p>
              <button onClick={() => setPanel('add')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
                + 첫 문제 추가
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-5">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                  {/* 순서 변경 */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button onClick={() => handleMoveQuestion(q, -1)} disabled={i === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
                    <span className="text-xs font-bold text-gray-400 text-center">{i + 1}</span>
                    <button onClick={() => handleMoveQuestion(q, 1)} disabled={i === questions.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[q.type]}`}>
                        {typeLabel[q.type]}
                      </span>
                      <span className="text-xs font-semibold text-indigo-500">{q.points}P</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm leading-relaxed">{q.content}</p>

                    {q.type === 'multiple' && q.options && (
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-lg ${
                            q.answer === String(oi)
                              ? 'bg-indigo-100 text-indigo-700 font-semibold'
                              : 'bg-white text-gray-500 border border-gray-200'
                          }`}>
                            {oi + 1}. {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'short' && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">정답: {q.answer}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditTarget(q); setPanel('edit') }}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-indigo-400 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q)}
                      className="text-xs px-3 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <button
              onClick={() => setPanel('add')}
              className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 rounded-2xl font-medium text-sm transition-colors"
            >
              + 문제 추가
            </button>
          )}
        </>
      )}

      {panel === 'add' && (
        <div>
          <button onClick={() => setPanel('list')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
            ← 목록으로
          </button>
          <h4 className="font-semibold text-gray-700 mb-4">새 문제 추가</h4>
          <QuestionForm
            onSave={handleAddQuestion}
            onCancel={() => setPanel('list')}
            saving={saving}
          />
        </div>
      )}

      {panel === 'edit' && editTarget && (
        <div>
          <button onClick={() => { setPanel('list'); setEditTarget(null) }}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
            ← 목록으로
          </button>
          <h4 className="font-semibold text-gray-700 mb-4">문제 수정</h4>
          <QuestionForm
            initial={{
              type: editTarget.type,
              content: editTarget.content,
              options: editTarget.options ?? ['', '', '', ''],
              answer: editTarget.answer,
              points: editTarget.points,
            }}
            onSave={handleEditQuestion}
            onCancel={() => { setPanel('list'); setEditTarget(null) }}
            saving={saving}
          />
        </div>
      )}
    </Modal>
  )
}
