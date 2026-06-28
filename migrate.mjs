import { initializeApp } from 'firebase/app'
import { getFirestore, setDoc, doc } from 'firebase/firestore'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const db = getFirestore(app)

const FILIERES = [
  { slug: 'droit', label: 'Droit', emoji: '⚖️', ordre: 1 },
  { slug: 'medecine', label: 'Médecine', emoji: '🏥', ordre: 2 },
  { slug: 'informatique', label: 'Informatique', emoji: '💻', ordre: 3 },
  { slug: 'economie', label: 'Économie', emoji: '📊', ordre: 4 },
  { slug: 'lettres', label: 'Lettres & Sciences Humaines', emoji: '📖', ordre: 5 },
  { slug: 'sciences', label: 'Sciences', emoji: '🔬', ordre: 6 },
  { slug: 'pharmacie', label: 'Pharmacie', emoji: '💊', ordre: 7 },
  { slug: 'polytechnique', label: 'Polytechnique', emoji: '⚙️', ordre: 8 },
  { slug: 'agronomie', label: 'Agronomie', emoji: '🌱', ordre: 9 },
  { slug: 'psychologie', label: 'Psychologie', emoji: '🧠', ordre: 10 },
  { slug: 'communication', label: 'Communication', emoji: '📡', ordre: 11 },
  { slug: 'architecture', label: 'Architecture', emoji: '🏛️', ordre: 12 },
  { slug: 'criminologie', label: 'Criminologie', emoji: '🔍', ordre: 13 },
  { slug: 'sciences-politiques', label: 'Sciences Politiques & Administratives', emoji: '🗳️', ordre: 14 },
]

for (const f of FILIERES) {
  await setDoc(doc(db, 'filieres', f.slug), f)
  console.log('Migré:', f.label)
}
console.log('Migration terminée !')
process.exit(0)
