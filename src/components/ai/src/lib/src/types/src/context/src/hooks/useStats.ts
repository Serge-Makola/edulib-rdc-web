'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useDocs } from './useDocs'

export function useStats() {
  const [userCount, setUserCount] = useState(0)
  const { docs } = useDocs()

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'stats', 'public'), (snap) => {
      if (snap.exists()) setUserCount(snap.data().userCount ?? 0)
    })
    return unsub
  }, [])

  return {
    userCount,
    docCount: docs.length,
    filiereCount: new Set(docs.map(d => d.filiere)).size,
  }
}
