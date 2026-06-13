'use client'

import { useState, useCallback } from 'react'
import type { Doc } from '@/types'

export function useCart() {
  const [cart, setCart] = useState<Doc[]>([])

  const addToCart = useCallback((doc: Doc) => {
    setCart(prev => prev.find(d => d.id === doc.id) ? prev : [...prev, doc])
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(d => d.id !== id))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const total = cart.reduce((sum, d) => sum + d.prix, 0)
  const isInCart = (id: string) => cart.some(d => d.id === id)

  return { cart, addToCart, removeFromCart, clearCart, total, isInCart }
}
