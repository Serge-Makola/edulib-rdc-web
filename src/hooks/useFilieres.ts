'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Filiere {
  slug: string
  label: string
  emoji: string
  ordre: number
}

export function useFilieres() {
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'filieres'), orderBy('ordre', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setFilieres(snap.docs.map(d => ({ slug: d.id, ...d.data() } as Filiere)))
      setLoading(false)
    })
    return unsub
  }, [])

  return { filieres, loading }
}
