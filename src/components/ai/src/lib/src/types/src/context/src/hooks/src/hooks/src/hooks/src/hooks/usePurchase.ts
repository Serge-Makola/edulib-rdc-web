'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { Doc } from '@/types'

export function usePurchase() {
  const { currentUser, firebaseUser } = useAuth()
  const [loading, setLoading] = useState(false)

  async function initiatePurchase(docs: Doc[]): Promise<{ orderId: string; total: number } | null> {
    if (!currentUser || !firebaseUser) return null
    setLoading(true)
    try {
      const total = docs.reduce((s, d) => s + d.prix, 0)
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: firebaseUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        items: docs.map(d => ({ id: d.id, title: d.title, prix: d.prix })),
        total,
        status: 'En attente de paiement',
        createdAt: serverTimestamp(),
      })
      return { orderId: orderRef.id, total }
    } catch (e) {
      console.error('initiatePurchase error:', e)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Appelé par l'admin pour confirmer un paiement reçu
  async function confirmPayment(orderId: string, userId: string, docIds: string[]) {
    try {
      // Mettre à jour le statut de la commande
      await updateDoc(doc(db, 'orders', orderId), { status: 'Payé' })
      // Ajouter les documents au boughtIds de l'utilisateur
      await updateDoc(doc(db, 'users', userId), {
        boughtIds: arrayUnion(...docIds),
      })
      return true
    } catch (e) {
      console.error('confirmPayment error:', e)
      return false
    }
  }

  return { initiatePurchase, confirmPayment, loading }
}
