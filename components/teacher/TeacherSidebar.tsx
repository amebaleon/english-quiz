'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'

const navItems: { href: string; label: string; icon: IconName; exact: boolean }[] = [
  { href: '/teacher', label: '대시보드', icon: 'home', exact: true },
  { href: '/teacher/students', label: '학생 관리', icon: 'users', exact: false },
  { href: '/teacher/quizzes', label: '퀴즈 관리', icon: 'pencil', exact: false },
  { href: '/teacher/session', label: '세션 진행', icon: 'play', exact: false },
  { href: '/teacher/help', label: '도움말', icon: 'question-mark', exact: false },
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
    <aside className="w-56 bg-indigo-900 text-white flex flex-col shrink-0 animate-sidebar-in">
      <div className="p-6 border-b border-indigo-800/60">
        <h1 className="text-xl font-bold tracking-tight">영어퀴즈</h1>
        <p className="text-indigo-300 text-xs mt-1">선생님 대시보드</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item, i) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && !(item.exact && pathname !== item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ animationDelay: `${i * 0.05 + 0.15}s` }}
              className={`animate-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                  : 'text-indigo-300 hover:bg-indigo-800/70 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon
                  name={item.icon}
                  size={18}
                  strokeWidth={active ? 2 : 1.75}
                  className={active ? 'text-white' : 'text-indigo-400 group-hover:text-white transition-colors duration-200'}
                />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.href === '/teacher/session' && activeSession && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-indigo-800/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-indigo-400 hover:text-white hover:bg-indigo-800/70 rounded-xl text-sm font-medium transition-all duration-200 group hover:translate-x-0.5"
        >
          <Icon name="logout" size={18} strokeWidth={1.75} className="text-indigo-400 group-hover:text-white transition-colors duration-200" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
