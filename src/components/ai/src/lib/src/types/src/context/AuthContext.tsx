'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, increment, updateDoc } from 'firebase/firestore'
import { auth, db, ADMIN_UID } from '@/lib/firebase'
import type { User } from '@/types'

interface AuthContextType {
  currentUser: User | null
  firebaseUser: FirebaseUser | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (name: string, email: string, pass: string, role: string, filiere: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = firebaseUser?.uid === ADMIN_UID

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        if (snap.exists()) {
          setCurrentUser({ uid: fbUser.uid, ...snap.data() } as User)
        }
      } else {
        setCurrentUser(null)
      }
      setIsLoading(false)
    })
    return unsub
  }, [])

  async function login(email: string, pass: string) {
    const cred = await signInWithEmailAndPassword(auth, email, pass)
    // Poser le cookie de session pour le middleware
    const token = await cred.user.getIdToken()
    document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`
    if (cred.user.uid === ADMIN_UID) {
      document.cookie = `el_admin=1; path=/; max-age=3600; SameSite=Strict`
    }
  }

  async function register(name: string, email: string, pass: string, role: string, filiere: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    await setDoc(doc(db, 'users', cred.user.uid), {
      name, email, role, filiere,
      boughtIds: [],
      createdAt: Date.now(),
      uid: cred.user.uid,
    })
    await setDoc(doc(db, 'stats', 'public'), { userCount: increment(1) }, { merge: true })
    const token = await cred.user.getIdToken()
    document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`
  }

  async function logout() {
    await signOut(auth)
    setCurrentUser(null)
    // Supprimer les cookies de session
    document.cookie = '__session=; path=/; max-age=0'
    document.cookie = 'el_admin=; path=/; max-age=0'
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider value={{
      currentUser, firebaseUser, isAdmin, isLoading,
      login, register, logout, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
