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

function getBestExcerpt(text: string, keywords: string[], windowSize = 2000, step = 1000): string {
  if (text.length <= windowSize) return text

  let bestScore = -1
  let bestStart = 0

  for (let start = 0; start < text.length; start += step) {
    const window = text.slice(start, start + windowSize).toLowerCase()
    let score = 0
    keywords.forEach(kw => {
      const count = (window.match(new RegExp(kw, 'g')) || []).length
      score += count
    })
    if (score > bestScore) {
      bestScore = score
      bestStart = start
    }
  }

  console.log(`  -> Meilleure fenetre trouvee a la position ${bestStart} (score: ${bestScore})`)
  return text.slice(bestStart, bestStart + windowSize)
}

function getRelevantDocs(docs: any[], query: string, maxDocs = 3): string {
  if (!query || docs.length === 0) return ''
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
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs)
  console.log('DOCUMENTS TROUVES ET LEUR SCORE:')
  scored.forEach(d => console.log(`- ${d.title} (score: ${d.score})`))
  if (scored.length === 0) return ''
  return '\n\nDOCUMENTS DISPONIBLES SUR EDULIB RDC PERTINENTS POUR CETTE QUESTION :\n' +
    scored.map(d => {
      console.log(`\nExtraction pour: ${d.title}`)
      return `--- ${d.title} (${d.filiere} - ${d.type}) ---\n${getBestExcerpt(d.extractedText || '', keywords)}`
    }).join('\n\n')
}

async function run() {
  const snap = await getDocs(collection(db, 'documents'))
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`Total documents dans Firestore: ${docs.length}`)
  const result = getRelevantDocs(docs, 'Explique-moi les principes du droit constitutionnel congolais')
  console.log('\n--- CONTEXTE ENVOYE A MISTRAL ---')
  console.log(result)
}

run()
