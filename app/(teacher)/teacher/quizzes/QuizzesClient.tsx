'use client'

import { useState, useMemo } from 'react'
import QuizEditorModal from '@/components/teacher/quizzes/QuizEditorModal'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useToast } from '@/lib/hooks/useToast'

interface Quiz {
  id: string
  title: string
  category: string
  created_at: string
  questions: { count: number }[]
}

const CATEGORY_SUGGESTIONS = ['문법', '어휘', '독해', '듣기', '회화', '쓰기', '기타']

const CATEGORY_COLORS: Record<string, string> = {
  '문법':  'bg-indigo-50  text-indigo-600  border-indigo-200',
  '어휘':  'bg-emerald-50 text-emerald-600 border-emerald-200',
  '독해':  'bg-amber-50   text-amber-600   border-amber-200',
  '듣기':  'bg-sky-50     text-sky-600     border-sky-200',
  '회화':  'bg-pink-50    text-pink-600    border-pink-200',
  '쓰기':  'bg-violet-50  text-violet-600  border-violet-200',
  '기타':  'bg-gray-100   text-gray-500    border-gray-200',
}

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-500 border-gray-200'
}

export default function QuizzesClient({ initialQuizzes }: { initialQuizzes: Quiz[] }) {
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null)
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('기타')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('전체')
  const { toast, showToast, clearToast } = useToast()

  const categories = useMemo(() => {
    const cats = Array.from(new Set(quizzes.map(q => q.category || '기타')))
    return ['전체', ...cats.sort()]
  }, [quizzes])

  const filtered = useMemo(() =>
    activeTab === '전체' ? quizzes : quizzes.filter(q => (q.category || '기타') === activeTab),
    [quizzes, activeTab]
  )

  function questionCount(quiz: Quiz) {
    return quiz.questions?.[0]?.count ?? 0
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    const res = await fetch('/api/teacher/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, category: newCategory }),
    })
    const json = await res.json()
    setCreating(false)
    if (!json.success) { showToast(json.error, 'error'); return }

    const newQuiz = { ...json.data, category: json.data.category ?? newCategory, questions: [{ count: 0 }] }
    setQuizzes(prev => [newQuiz, ...prev])
    setNewTitle('')
    setNewCategory('기타')
    setShowForm(false)
    setEditingQuiz(newQuiz)
    showToast('퀴즈 생성 완료')
  }

  async function handleDelete(quiz: Quiz) {
    if (!confirm(`"${quiz.title}" 퀴즈를 삭제할까요?\n모든 문제도 함께 삭제됩니다.`)) return
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id))
      showToast('퀴즈 삭제 완료')
    } else {
      showToast(json.error, 'error')
    }
  }

  function handleTitleUpdated(quizId: string, title: string) {
    setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, title } : q))
  }

  async function handleDuplicate(quiz: Quiz) {
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}/duplicate`, { method: 'POST' })
    const json = await res.json()
    if (!json.success) { showToast(json.error, 'error'); return }
    setQuizzes(prev => [{ ...json.data, category: quiz.category }, ...prev])
    showToast(`"${quiz.title}" 복제 완료`)
  }

  async function handlePreview(quiz: Quiz) {
    setPreviewQuiz(quiz)
    setPreviewLoading(true)
    const res = await fetch(`/api/teacher/quizzes/${quiz.id}/questions`)
    const json = await res.json()
    setPreviewLoading(false)
    if (json.success) setPreviewQuestions(json.data)
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">퀴즈 관리</h2>
          <p className="text-gray-400 text-sm mt-0.5">총 {quizzes.length}개</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            + 퀴즈 만들기
          </button>
        )}
      </div>

      {/* 새 퀴즈 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-indigo-200 p-5 mb-5 space-y-3 animate-fade-in">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
            placeholder="퀴즈 제목 (예: Unit 3 단어 퀴즈)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          />
          {/* 카테고리 선택 */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">카테고리</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_SUGGESTIONS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                    newCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <input
                value={CATEGORY_SUGGESTIONS.includes(newCategory) ? '' : newCategory}
                onChange={e => setNewCategory(e.target.value || '기타')}
                placeholder="직접 입력"
                className="px-3 py-1 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:border-indigo-400 w-24"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-semibold text-sm transition-colors">
              {creating ? '생성 중...' : '생성'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setNewTitle(''); setNewCategory('기타') }}
              className="px-4 py-2.5 border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-xl text-sm">
              취소
            </button>
          </div>
        </form>
      )}

      {/* 카테고리 탭 */}
      {quizzes.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat}
              <span className={`ml-1.5 text-xs ${activeTab === cat ? 'text-indigo-200' : 'text-gray-400'}`}>
                {cat === '전체' ? quizzes.length : quizzes.filter(q => (q.category || '기타') === cat).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 퀴즈 목록 */}
      {filtered.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-500 mb-4">{activeTab === '전체' ? '퀴즈가 없습니다.' : `"${activeTab}" 카테고리에 퀴즈가 없습니다.`}</p>
          {activeTab === '전체' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
            >
              첫 퀴즈 만들기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColor(quiz.category || '기타')}`}>
                  {quiz.category || '기타'}
                </span>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                  questionCount(quiz) === 0 ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {questionCount(quiz)}문제
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 leading-snug mb-1 mt-2">{quiz.title}</h3>
              <p className="text-xs text-gray-400 mb-4">
                {new Date(quiz.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setEditingQuiz(quiz)} className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-medium transition-colors">
                  문제 편집
                </button>
                <button onClick={() => handlePreview(quiz)} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm transition-colors">
                  미리보기
                </button>
                <button onClick={() => handleDuplicate(quiz)} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm transition-colors">
                  복제
                </button>
                <button onClick={() => handleDelete(quiz)} className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingQuiz && (
        <QuizEditorModal
          quiz={editingQuiz}
          onClose={() => setEditingQuiz(null)}
          onTitleUpdated={title => handleTitleUpdated(editingQuiz.id, title)}
        />
      )}

      {previewQuiz && (
        <Modal title={`미리보기: ${previewQuiz.title}`} onClose={() => { setPreviewQuiz(null); setPreviewQuestions([]) }} size="lg">
          {previewLoading ? (
            <p className="text-center text-gray-400 py-12">불러오는 중...</p>
          ) : previewQuestions.length === 0 ? (
            <p className="text-center text-gray-400 py-12">문제가 없습니다.</p>
          ) : (
            <div className="space-y-5">
              {previewQuestions.map((q, i) => (
                <div key={q.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-emerald-500 text-white px-5 py-3 flex justify-between items-center">
                    <span className="text-sm font-medium">문제 {i + 1} · {q.type === 'multiple' ? '객관식' : '주관식'}</span>
                    <span className="text-sm font-bold">{q.points}P</span>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-800 font-semibold text-lg mb-4">{q.content}</p>
                    {q.type === 'multiple' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div key={oi} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
                            q.answer === String(oi) ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              q.answer === String(oi) ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                            }`}>{oi + 1}</span>
                            <span className="text-gray-700">{opt}</span>
                            {q.answer === String(oi) && <span className="ml-auto text-emerald-500 text-xs font-bold">정답</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'short' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <span className="text-xs font-semibold text-emerald-600">정답: </span>
                        <span className="text-emerald-700 font-medium">{q.answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}
    </div>
  )
}
