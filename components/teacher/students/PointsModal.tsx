'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'

interface Student { id: string; name: string; total_points: number }
interface HistoryItem { id: string; delta: number; reason: string; created_at: string }

interface Props {
  student: Student
  onClose: () => void
  onUpdated: () => void
}

type Tab = 'adjust' | 'history'

export default function PointsModal({ student, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('adjust')
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  async function loadHistory() {
    setHistoryLoading(true)
    const res = await fetch(`/api/teacher/points/${student.id}`)
    const json = await res.json()
    setHistoryLoading(false)
    if (json.success) setHistory(json.data)
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const d = parseInt(delta)
    if (!d) { setError('포인트를 입력하세요.'); return }
    if (!reason.trim()) { setError('사유를 입력하세요.'); return }
    setLoading(true)

    const res = await fetch('/api/teacher/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, delta: d, reason }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.success) { setError(json.error); return }
    onUpdated()
    setDelta('')
    setReason('')
  }

  async function handleReset() {
    if (!confirm(`${student.name}의 포인트를 초기화할까요?`)) return
    setLoading(true)
    await fetch(`/api/teacher/points/${student.id}`, { method: 'DELETE' })
    setLoading(false)
    onUpdated()
    onClose()
  }

  return (
    <Modal title={`${student.name} — 포인트`} onClose={onClose} size="md">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-3xl font-bold text-indigo-600">
          {student.total_points.toLocaleString()} P
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-red-500 hover:text-red-700 hover:underline"
        >
          초기화
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-5">
        {(['adjust', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'adjust' ? '포인트 조정' : '히스토리'}
          </button>
        ))}
      </div>

      {tab === 'adjust' && (
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              조정 포인트 <span className="text-gray-400 font-normal">(음수 = 차감)</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDelta(d => d.startsWith('-') ? d.slice(1) : '-' + d)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-mono font-bold">
                ±
              </button>
              <input
                value={delta}
                onChange={e => setDelta(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder="10"
                inputMode="numeric"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 20, 50, 100].map(v => (
                <button key={v} type="button" onClick={() => setDelta(String(v))}
                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="예: 발표 보너스"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
      )}

      {tab === 'history' && (
        <div>
          {historyLoading ? (
            <p className="text-center text-gray-400 py-8">불러오는 중...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-400 py-8">히스토리가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {history.map(h => (
                <li key={h.id} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{h.reason}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(h.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${h.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {h.delta > 0 ? '+' : ''}{h.delta} P
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
