'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | ''
  onClose: () => void
}

export function Toast({ message, type = '', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    success: { bg: 'var(--green-light)', color: '#166534', border: '#22c55e' },
    error:   { bg: 'var(--red-light)',   color: '#991b1b', border: '#ef4444' },
    info:    { bg: 'var(--blue-light)',  color: '#1e40af', border: 'var(--blue)' },
    '':      { bg: 'var(--surface-2)',   color: 'var(--ink)', border: 'var(--border)' },
  }
  const c = colors[type] || colors['']

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '12px 20px', fontSize: '0.875rem', fontWeight: 500,
      boxShadow: 'var(--shadow-md)', zIndex: 9999, whiteSpace: 'nowrap',
      animation: 'slideUp 0.2s ease',
    }}>
      {message}
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  )
}

// Hook global pour les toasts
let _setToast: ((t: { message: string; type?: string } | null) => void) | null = null

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null)
  _setToast = setToast

  return (
    <>
      {children}
      {toast && <Toast message={toast.message} type={toast.type as any} onClose={() => setToast(null)} />}
    </>
  )
}

export function showToast(message: string, type: 'success' | 'error' | 'info' | '' = '') {
  _setToast?.({ message, type })
}
