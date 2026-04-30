import { useState } from 'react'

interface Toast {
  msg: string
  type: 'success' | 'error'
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })
  const clearToast = () => setToast(null)
  return { toast, showToast, clearToast }
}
