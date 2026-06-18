'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { Doc } from '@/types'

export function usePurchase() {
  const { currentUser, firebaseUser } = useAuth()
  const [loading, setLoading] = useState(false)

  async function initiatePurchase(docs: Doc[]): Promise<string | null> {
    if (!currentUser || !firebaseUser) return null
    setLoading(true)
    try {
      const total = docs.reduce((s, d) => s + d.prix, 0)
      const ref = await addDoc(collection(db, 'orders'), {
        userId: firebaseUser.uid, userName: currentUser.name, userEmail: currentUser.email,
        items: docs.map(d => ({ id: d.id, title: d.title, prix: d.prix })),
        total, status: 'En attente de paiement', createdAt: serverTimestamp(),
      })
      return ref.id
    } catch { return null } finally { setLoading(false) }
  }

  return { initiatePurchase, loading }
}
