'use client'

import { useState } from 'react'

export interface QuestionDraft {
  type: 'multiple' | 'short'
  content: string
  options: string[]
  answer: string
  points: number
}

interface Props {
  initial?: Partial<QuestionDraft>
  onSave: (q: QuestionDraft) => void
  onCancel: () => void
  saving?: boolean
}

const EMPTY: QuestionDraft = {
  type: 'multiple',
  content: '',
  options: ['', '', '', ''],
  answer: '0',
  points: 10,
}

export default function QuestionForm({ initial, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<QuestionDraft>({ ...EMPTY, ...initial })

  function setField<K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setOption(index: number, value: string) {
    setForm(prev => {
      const options = [...prev.options]
      options[index] = value
      return { ...prev, options }
    })
  }

  function handleTypeChange(type: 'multiple' | 'short') {
    setForm(prev => ({ ...prev, type, answer: type === 'multiple' ? '0' : '', options: ['', '', '', ''] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 유형 선택 */}
      <div className="flex gap-2">
        {(['multiple', 'short'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
              form.type === t
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
            }`}
          >
            {t === 'multiple' ? '📋 객관식' : '✏️ 주관식'}
          </button>
        ))}
      </div>

      {/* 문제 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">문제</label>
        <textarea
          value={form.content}
          onChange={e => setField('content', e.target.value)}
          required
          rows={3}
          placeholder="문제를 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-800"
        />
      </div>

      {/* 객관식 보기 */}
      {form.type === 'multiple' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">보기 (정답 선택)</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setField('answer', String(i))}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    form.answer === String(i)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300 text-gray-400 hover:border-indigo-400'
                  }`}
                >
                  {i + 1}
                </button>
                <input
                  value={opt}
                  onChange={e => setOption(i, e.target.value)}
                  required
                  placeholder={`보기 ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">번호 클릭 → 정답 선택</p>
        </div>
      )}

      {/* 주관식 정답 */}
      {form.type === 'short' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">정답</label>
          <input
            value={form.answer}
            onChange={e => setField('answer', e.target.value)}
            required
            placeholder="정답을 입력하세요 (참고용 — 주관식은 선생님이 직접 채점)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">주관식은 세션 진행 시 선생님이 직접 O/X 채점합니다.</p>
        </div>
      )}

      {/* 포인트 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">포인트</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={form.points}
            onChange={e => setField('points', Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={1000}
            className="w-28 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            {[5, 10, 20, 50].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setField('points', v)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  form.points === v
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                }`}
              >
                {v}P
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
          취소
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
