'use client'

import { useState, useMemo } from 'react'
import AddStudentModal from '@/components/teacher/students/AddStudentModal'
import BulkImportModal from '@/components/teacher/students/BulkImportModal'
import PointsModal from '@/components/teacher/students/PointsModal'
import PinResetModal from '@/components/teacher/students/PinResetModal'
import StatsModal from '@/components/teacher/students/StatsModal'
import ProfileEditModal from '@/components/teacher/students/ProfileEditModal'
import Toast from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/lib/hooks/useToast'
import { gradeLabel } from '@/lib/utils/grade'

interface Class { id: string; name: string }
interface Student {
  id: string; name: string; class_id: string | null
  total_points: number; birth_year: number | null; school: string | null
  created_at: string
  classes: { id: string; name: string } | { id: string; name: string }[] | null
}

interface Props {
  initialStudents: Student[]
  initialClasses: Class[]
}

type ModalType = 'add' | 'bulk' | 'points' | 'pin' | 'stats' | 'profile' | 'class' | null

export default function StudentsClient({ initialStudents, initialClasses }: Props) {
  const [students, setStudents] = useState(initialStudents)
  const [classes, setClasses] = useState(initialClasses)
  const [modal, setModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'points'>('name')
  const { toast, showToast, clearToast } = useToast()
  // 반 관리
  const [newClassName, setNewClassName] = useState('')
  const [classLoading, setClassLoading] = useState(false)

  const filtered = useMemo(() => {
    let list = students
    if (filterClass !== 'all') list = list.filter(s => s.class_id === filterClass)
    if (search.trim()) list = list.filter(s => s.name.includes(search.trim()))
    return [...list].sort((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : b.total_points - a.total_points
    )
  }, [students, filterClass, search, sortBy])

  function refreshStudents() {
    fetch('/api/teacher/students')
      .then(r => r.json())
      .then(json => { if (json.success) setStudents(json.data) })
      .catch(() => showToast('학생 목록을 불러오지 못했습니다.', 'error'))
  }

  async function handleDelete(student: Student) {
    if (!confirm(`${student.name}을(를) 삭제할까요?`)) return
    const res = await fetch(`/api/teacher/students/${student.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      setStudents(prev => prev.filter(s => s.id !== student.id))
      showToast(`${student.name} 삭제 완료`)
    } else {
      showToast(json.error, 'error')
    }
  }

  async function handleChangeClass(student: Student, class_id: string | null) {
    await fetch(`/api/teacher/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id }),
    })
    refreshStudents()
    showToast('반 변경 완료')
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    if (!newClassName.trim()) return
    setClassLoading(true)
    const res = await fetch('/api/teacher/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName.trim() }),
    })
    const json = await res.json()
    setClassLoading(false)
    if (json.success) {
      setClasses(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewClassName('')
      showToast('반 추가 완료')
    }
  }

  async function handleDeleteClass(cls: Class) {
    if (!confirm(`"${cls.name}"을 삭제할까요?\n해당 반 학생들은 반 없음으로 변경됩니다.`)) return
    await fetch(`/api/teacher/classes/${cls.id}`, { method: 'DELETE' })
    setClasses(prev => prev.filter(c => c.id !== cls.id))
    refreshStudents()
    showToast(`${cls.name} 삭제 완료`)
  }

  async function handleResetClassPoints(cls: Class) {
    if (!confirm(`"${cls.name}" 전체 포인트를 초기화할까요?`)) return
    await fetch('/api/teacher/points/reset-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: cls.id }),
    })
    refreshStudents()
    showToast(`${cls.name} 포인트 초기화 완료`)
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
          <p className="text-gray-400 text-sm mt-0.5">총 {students.length}명</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModal('class')}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            반 관리
          </button>
          <button
            onClick={() => setModal('bulk')}
            className="px-4 py-2.5 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium transition-colors"
          >
            일괄 등록
          </button>
          <button
            onClick={() => setModal('add')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            + 학생 추가
          </button>
        </div>
      </div>

      {/* 필터 + 검색 */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름 검색..."
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm w-48"
        />
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
        >
          <option value="all">전체 반</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'name' | 'points')}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
        >
          <option value="name">이름순</option>
          <option value="points">포인트순</option>
        </select>

        {/* 포인트 초기화 (반 선택 시) */}
        {filterClass !== 'all' && (
          <button
            onClick={() => {
              const cls = classes.find(c => c.id === filterClass)
              if (cls) handleResetClassPoints(cls)
            }}
            className="px-4 py-2 text-sm border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            반 포인트 초기화
          </button>
        )}
      </div>

      {/* 학생 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">이름</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">반</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">학교 / 학년</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">포인트</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  {students.length === 0 ? '학생을 추가해 주세요.' : '검색 결과가 없습니다.'}
                </td>
              </tr>
            ) : filtered.map(student => {
              const grade = gradeLabel(student.birth_year)
              return (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                <td className="px-6 py-4">
                  <select
                    value={student.class_id ?? ''}
                    onChange={e => handleChangeClass(student, e.target.value || null)}
                    className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg px-2 py-1 hover:border-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">없음</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    {student.school && <span className="text-sm text-gray-700">{student.school}</span>}
                    {grade && <span className="text-xs text-indigo-500 font-semibold">{grade}</span>}
                    {!student.school && !grade && <span className="text-xs text-gray-300">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-indigo-600">{student.total_points.toLocaleString()} P</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setSelected(student); setModal('profile') }}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      프로필
                    </button>
                    <button
                      onClick={() => { setSelected(student); setModal('points') }}
                      className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                    >
                      포인트
                    </button>
                    <button
                      onClick={() => { setSelected(student); setModal('stats') }}
                      className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                    >
                      통계
                    </button>
                    <button
                      onClick={() => { setSelected(student); setModal('pin') }}
                      className="px-3 py-1.5 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors font-medium"
                    >
                      PIN
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* 모달들 */}
      {modal === 'bulk' && (
        <BulkImportModal
          onClose={() => setModal(null)}
          onDone={(created) => { refreshStudents(); showToast(`${created}명 등록 완료`) }}
        />
      )}
      {modal === 'add' && (
        <AddStudentModal
          classes={classes}
          onClose={() => setModal(null)}
          onAdded={student => {
            refreshStudents()
            setModal(null)
            showToast(`${student.name} 추가 완료`)
          }}
        />
      )}

      {modal === 'points' && selected && (
        <PointsModal
          student={selected}
          onClose={() => setModal(null)}
          onUpdated={() => { refreshStudents(); showToast('포인트 저장 완료') }}
        />
      )}

      {modal === 'pin' && selected && (
        <PinResetModal
          student={selected}
          onClose={() => setModal(null)}
          onReset={() => showToast('PIN 변경 완료')}
        />
      )}

      {modal === 'stats' && selected && (
        <StatsModal student={selected} onClose={() => setModal(null)} />
      )}

      {modal === 'profile' && selected && (
        <ProfileEditModal
          student={selected}
          onClose={() => setModal(null)}
          onSaved={() => { refreshStudents(); showToast('프로필 저장 완료') }}
        />
      )}

      {/* 반 관리 모달 */}
      {modal === 'class' && (
        <Modal title="반 관리" onClose={() => setModal(null)} size="sm">
          <form onSubmit={handleAddClass} className="flex gap-2 mb-5">
            <input
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="새 반 이름 (예: 3학년A반)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={classLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold"
            >
              추가
            </button>
          </form>

          {classes.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">반이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {classes.map(cls => (
                <li key={cls.id} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">{cls.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { handleResetClassPoints(cls) }}
                      className="text-xs text-amber-500 hover:underline"
                    >
                      포인트 초기화
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      )}
    </div>
  )
}
