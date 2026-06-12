'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Entrez votre adresse email.'); return }
    setLoading(true); setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'Aucun compte associé à cet email.',
        'auth/invalid-email': 'Adresse email invalide.',
      }
      setError(msgs[err.code] || "Erreur. Vérifiez l'email et réessayez.")
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
      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        padding: 'clamp(1.75rem, 4vw, 2.5rem)',
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Image src="/icons/icon-192.png" alt="EduLib RDC" width={52} height={52}
              style={{ objectFit: 'contain', borderRadius: 14 }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Mot de passe oublié
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>Email envoyé</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Un lien a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception et vos spams.
            </p>
            <Link href="/login" style={{
              display: 'block', background: 'var(--blue)', color: '#fff',
              borderRadius: 10, padding: '12px', textAlign: 'center',
              fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            }}>Retour à la connexion</Link>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: 'var(--red-light)', border: '1px solid var(--red)',
                borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem',
                fontSize: '0.85rem', color: 'var(--red)', fontWeight: 500,
              }}>⚠️ {error}</div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" autoComplete="email"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface-2)', color: 'var(--ink)',
                    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                  }} />
              </div>
              <button type="submit" disabled={loading} style={{
                background: loading ? 'var(--border)' : 'var(--blue)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
              <Link href="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                ← Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
      <Link href="/" style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', textDecoration: 'none' }}>
        ← Retour à l'accueil
      </Link>
    </div>
  )
}
