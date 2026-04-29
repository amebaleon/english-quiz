'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Class { id: string; name: string }
interface Props {
  classes: Class[]
  onClose: () => void
  onAdded: (student: any) => void
}

export default function AddStudentModal({ classes, onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [classId, setClassId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin, class_id: classId || null }),
    })
    const json = await res.json()
    setLoading(false)

    if (!json.success) { setError(json.error); return }
    onAdded(json.data)
  }

  return (
    <Modal title="학생 추가" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="홍길동"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4자리)</label>
          <input
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">반 (선택)</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">반 없음</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
