import { NextRequest, NextResponse } from 'next/server'
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

  if (scored.length === 0) return ''

  return '\n\nDOCUMENTS DISPONIBLES SUR EDULIB RDC PERTINENTS POUR CETTE QUESTION :\n' +
    scored.map(d =>
      `--- ${d.title} (${d.filiere} - ${d.type}) ---\n${(d.extractedText || '').slice(0, 1500)}`
    ).join('\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    // Récupérer la dernière question de l'utilisateur
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    const userQuery = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

    // Chercher les documents pertinents dans Firestore
    let docsContext = ''
    try {
      const snap = await getDocs(collection(db, 'documents'))
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docsContext = getRelevantDocs(docs, userQuery)
    } catch {}

    // Injecter le contexte documentaire dans le system prompt
    const enrichedMessages = messages.map((m: any, i: number) => {
      if (i === 0 && m.role === 'system' && docsContext) {
        return { ...m, content: m.content + docsContext }
      }
      return m
    })

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MISTRAL_API_KEY
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: enrichedMessages,
        max_tokens: 2000,
        temperature: 0.3
      }),
    })

    const data = await response.json()
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? '' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
