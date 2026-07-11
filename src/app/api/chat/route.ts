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

function getRelevantDocs(docs: any[], query: string, maxDocs = 2): string {
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
      if (score > 0 && d.type === 'Loi') {
        score += 100
      }
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs)
  if (scored.length === 0) return ''
  return '\n\nDOCUMENTS DISPONIBLES SUR EDULIB RDC PERTINENTS POUR CETTE QUESTION :\n' +
    scored.map(d =>
      `--- ${d.title} (${d.filiere} - ${d.type}) ---\n${(d.extractedText || '').slice(0, 10000)}`
    ).join('\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    const userQuery = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''
    let docsContext = ''
    try {
      const snap = await getDocs(collection(db, 'documents'))
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docsContext = getRelevantDocs(docs, userQuery)
    } catch {}
    const conversationInputs = messages.map((m: any, idx: number) => {
      const isLastUserMsg = m === lastUserMsg
      const content = isLastUserMsg && docsContext ? `${m.content}${docsContext}` : m.content
      return { role: m.role, content }
    })
    const response = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        agent_id: 'ag_019f32d282ee74c3a7fe0fbcea223667',
        inputs: conversationInputs,
      }),
    })

    const data = await response.json()
    console.log('[DEBUG Mistral detail]', JSON.stringify(data.detail || data))

    const messageEntry = data.outputs?.find((o: any) => o.type === 'message.output')
    const contentParts = messageEntry?.content

    let textOutput = ''
    if (typeof contentParts === 'string') {
      textOutput = contentParts
    } else if (Array.isArray(contentParts)) {
      textOutput = contentParts
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('')
    }

    return NextResponse.json({ content: textOutput })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
