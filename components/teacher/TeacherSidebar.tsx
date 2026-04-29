'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/teacher', label: '대시보드', icon: '🏠', exact: true },
  { href: '/teacher/students', label: '학생 관리', icon: '👥', exact: false },
  { href: '/teacher/quizzes', label: '퀴즈 관리', icon: '📝', exact: false },
  { href: '/teacher/session', label: '세션 진행', icon: '▶️', exact: false },
  { href: '/teacher/help', label: '도움말', icon: '❓', exact: false },
]

export default function TeacherSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeSession, setActiveSession] = useState(false)

  useEffect(() => {
    fetch('/api/teacher/sessions')
      .then(r => r.json())
      .then(json => setActiveSession(!!json.data))
      .catch(() => {})
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/teacher/login')
  }

  return (
    <aside className="w-56 bg-indigo-900 text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-indigo-800">
        <h1 className="text-xl font-bold">영어퀴즈</h1>
        <p className="text-indigo-300 text-xs mt-1">선생님 대시보드</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && !(item.exact && pathname !== item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === '/teacher/session' && activeSession && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-xl text-sm transition-colors"
        >
          🚪 로그아웃
        </button>
      </div>
    </aside>
  )
}
