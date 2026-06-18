'use client'

import { useEffect, useState } from 'react'
import { collection, orderBy, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Doc } from '@/types'
import Fuse from 'fuse.js'

export function useDocs() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Doc)))
      setLoading(false)
    })
    return unsub
  }, [])

  function search(term: string, filiere?: string, type?: string): Doc[] {
    let results = docs
    if (filiere) results = results.filter(d => d.filiere?.toLowerCase() === filiere.toLowerCase())
    if (type) results = results.filter(d => d.type === type)
    if (!term.trim()) return results
    const fuse = new Fuse(results, { keys: ['title', 'prof', 'professeur', 'type', 'filiere'], threshold: 0.4, ignoreLocation: true })
    return fuse.search(term).map(r => r.item)
  }

  return { docs, loading, search }
}
