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
  return '\n\n[RESSOURCES EDULIB RDC PERTINENTES]\n' +
    scored.map(d =>
      `Titre: ${d.title}\nFiliere: ${d.filiere}\nType: ${d.type}\nExtrait:\n${(d.extractedText || '').slice(0, 1500)}`
    ).join('\n\n---\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Récupérer la dernière question
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    const userQuery = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

    // Chercher les documents pertinents
    let docsContext = ''
    try {
      const snap = await getDocs(collection(db, 'documents'))
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docsContext = getRelevantDocs(docs, userQuery)
    } catch {}

    // Construire l'input enrichi
    const enrichedInput = docsContext
      ? `${userQuery}\n\n${docsContext}\n\n[Utilise les ressources EduLib RDC ci-dessus si pertinentes pour ta reponse, en les citant explicitement.]`
      : userQuery

    // Construire l'historique de conversation pour l'agent
    const conversationHistory = messages
      .filter((m: any) => m.role !== 'system')
      .slice(-6) // Garder les 6 derniers messages pour le contexte
      .map((m: any, idx: number, arr: any[]) => {
        // Remplacer le dernier message utilisateur par la version enrichie
        if (idx === arr.length - 1 && m.role === 'user') {
          return { role: 'user', content: enrichedInput }
        }
        return { role: m.role, content: typeof m.content === 'string' ? m.content : userQuery }
      })

    const response = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        agent_id: 'ag_019f32d282ee74c3a7fe0fbcea223667',
        inputs: conversationHistory.length > 0
          ? conversationHistory
          : enrichedInput,
      }),
    })

    const data = await response.json()

    // Extraire le texte de la réponse
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

    if (!textOutput) {
      // Fallback si l'agent ne répond pas
      textOutput = 'Je suis desole, je ne peux pas repondre pour le moment. Verifie ta connexion.'
    }

    return NextResponse.json({ content: textOutput })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
