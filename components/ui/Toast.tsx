'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium animate-slide-up ${
      type === 'success' ? 'bg-gray-800' : 'bg-red-500'
    }`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
        type === 'success' ? 'bg-emerald-400' : 'bg-red-300'
      }`}>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}
