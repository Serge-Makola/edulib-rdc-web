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
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`Total documents dans Firestore: ${docs.length}\n`)

  console.log('--- TOUS LES TITRES CONTENANT "constitution" ---')
  docs.forEach((d: any) => {
    if ((d.title || '').toLowerCase().includes('constitution')) {
      console.log(`- ${d.title} | extractedText present: ${!!d.extractedText} | longueur: ${(d.extractedText || '').length}`)
    }
  })
}

run()
