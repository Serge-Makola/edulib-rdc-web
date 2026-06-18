'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Entrez votre email.'); return }
    setLoading(true); setError('')
    try { await resetPassword(email); setSent(true) } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'Aucun compte associe.' : 'Erreur. Reessayez.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2d4a 100%)', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 'clamp(1.75rem, 4vw, 2.5rem)', width: '100%', maxWidth: 400, boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>Mot de passe oublie</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Recevez un lien de reinitialisation</p>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>Email envoye</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Verifiez votre boite mail et vos spams.</p>
            <Link href="/login" style={{ display: 'block', background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', fontWeight: 700, textDecoration: 'none' }}>Retour a la connexion</Link>
          </div>
        ) : (
          <>
            {error && <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--red)' }}>⚠️ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" autoComplete="email" style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={loading} style={{ background: loading ? 'var(--border)' : 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link href="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>← Retour a la connexion</Link>
            </div>
          </>
        )}
      </div>
      <Link href="/" style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', textDecoration: 'none' }}>← Retour a l'accueil</Link>
    </div>
  )
}
