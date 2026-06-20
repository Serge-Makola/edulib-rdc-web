'use client'

import { useEffect } from 'react'

export default function AutoUpdate() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    async function registerSW() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        const reg2 = await navigator.serviceWorker.getRegistration()
        if (reg2) {
          setInterval(() => reg2.update(), 60000)
        }
      } catch {}
    }

    registerSW()
  }, [])

  return null
}
