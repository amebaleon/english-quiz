'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { gradeLabel } from '@/lib/utils/grade'

interface Student { id: string; name: string; birth_year: number | null; school: string | null }
interface Props {
  student: Student
  onClose: () => void
  onSaved: () => void
}

export default function ProfileEditModal({ student, onClose, onSaved }: Props) {
  const [birthYear, setBirthYear] = useState(student.birth_year ? String(student.birth_year) : '')
  const [school, setSchool] = useState(student.school ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const previewGrade = gradeLabel(birthYear ? Number(birthYear) : null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const year = birthYear ? Number(birthYear) : null
    if (year && (year < 1990 || year > new Date().getFullYear() - 4)) {
      setError('출생년도를 다시 확인해 주세요.')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/teacher/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birth_year: year, school: school.trim() || null }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.success) { setError(json.error); return }
    onSaved()
    onClose()
  }

  return (
    <Modal title={`${student.name} — 프로필 수정`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출생년도</label>
          <div className="flex items-center gap-3">
            <input
              value={birthYear}
              onChange={e => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="예: 2012"
              inputMode="numeric"
              maxLength={4}
              className="w-32 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest"
            />
            {previewGrade && (
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                {previewGrade}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">입력하면 학년이 자동 계산됩니다</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
          <input
            value={school}
            onChange={e => setSchool(e.target.value)}
            placeholder="예: 한빛중학교"
            maxLength={50}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors">
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
