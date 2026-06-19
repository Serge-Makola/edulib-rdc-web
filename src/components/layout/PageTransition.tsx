'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(14px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      {children}
    </div>
  )
}
