import { config } from 'dotenv'
config({ path: '.env.local' })

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

async function run() {
  const snap = await getDocs(collection(db, 'documents'))
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  const query = 'Explique-moi les principes du droit constitutionnel congolais'
  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(' ').filter(w => w.length > 3)

  const scored = docs
    .filter(d => d.extractedText)
    .map(d => {
      const text = (d.title + ' ' + d.filiere + ' ' + d.type + ' ' + (d.extractedText || '')).toLowerCase()
      let score = 0
      keywords.forEach(kw => {
        const count = (text.match(new RegExp(kw, 'g')) || []).length
        score += count
      })
      if (score > 0 && d.type === 'Loi') {
        score += 100
      }
      return { title: d.title, type: d.type, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  console.log('--- TOP 10 APRES BOOST ---')
  scored.forEach((d, i) => console.log(`${i + 1}. ${d.title} (${d.type}) - score: ${d.score}`))
}

run()
