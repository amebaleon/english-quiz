'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Props {
  student: { id: string; name: string }
  onClose: () => void
  onReset: () => void
}

export default function PinResetModal({ student, onClose, onReset }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(pin)) { setError('4자리 숫자를 입력하세요.'); return }
    setError('')
    setLoading(true)

    const res = await fetch(`/api/teacher/students/${student.id}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.success) { setError(json.error); return }
    onReset()
    onClose()
  }

  return (
    <Modal title={`PIN 초기화 — ${student.name}`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">새 PIN 4자리를 입력하세요.</p>
        <input
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          required
          placeholder="새 PIN"
          inputMode="numeric"
          maxLength={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-center text-2xl"
        />
        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">취소</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl">
            {loading ? '저장 중...' : '변경'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
