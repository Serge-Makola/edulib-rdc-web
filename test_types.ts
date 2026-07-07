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

  console.log('--- TYPES UNIQUES UTILISES DANS TA BIBLIOTHEQUE ---')
  const typesUniques = new Set(docs.map(d => d.type))
  typesUniques.forEach(t => console.log(`- "${t}"`))

  console.log('\n--- DOCUMENTS DONT LE TITRE RESSEMBLE A UN TEXTE DE LOI ---')
  docs.forEach((d: any) => {
    const titre = (d.title || '')
    if (/constitution|^code |^loi |statut|loi n/i.test(titre)) {
      console.log(`- "${d.title}" | type: "${d.type}"`)
    }
  })
}

run()
