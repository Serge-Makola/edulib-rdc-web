'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !pass) { setError('Remplissez tous les champs.'); return }
    setLoading(true); setError('')
    try {
      await login(email, pass)
      router.push('/')
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'Aucun compte associé à cet email.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      }
      setError(msg[err.code] || 'Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2d4a 100%)',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        padding: 'clamp(1.75rem, 4vw, 2.5rem)',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }}>

        {/* Logo + titre */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Image src="/icons/icon-192.png" alt="EduLib RDC" width={52} height={52} style={{ objectFit: 'contain', borderRadius: 14 }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Connexion
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Accédez à votre bibliothèque
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'var(--red-light)', border: '1px solid var(--red)',
            borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem',
            fontSize: '0.85rem', color: 'var(--red)', fontWeight: 500,
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <Link href="/reset-password" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--border)' : 'var(--blue)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '13px', fontSize: '0.95rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            marginTop: '0.25rem', transition: 'all 0.15s',
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            S'inscrire gratuitement
          </Link>
        </div>
      </div>

      {/* Retour accueil */}
      <Link href="/" style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', textDecoration: 'none' }}>
        ← Retour à l'accueil
      </Link>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--surface-2)', color: 'var(--ink)',
  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}
