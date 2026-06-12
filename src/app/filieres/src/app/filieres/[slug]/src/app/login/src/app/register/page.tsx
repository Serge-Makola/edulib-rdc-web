'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FILIERES } from '@/types'

const ROLES = ['Étudiant', 'Enseignant', 'Chercheur']

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', pass: '', confirm: '', role: 'Étudiant', filiere: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { name, email, pass, confirm, role, filiere } = form
    if (!name || !email || !pass || !filiere) { setError('Tous les champs sont obligatoires.'); return }
    if (pass.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (pass !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError('')
    try {
      await register(name, email, pass, role, filiere)
      router.push('/')
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères).',
      }
      setError(msg[err.code] || 'Erreur lors de l\'inscription. Réessayez.')
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
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Image src="/icons/icon-192.png" alt="EduLib RDC" width={52} height={52} style={{ objectFit: 'contain', borderRadius: 14 }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Créer un compte
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Rejoignez la bibliothèque EduLib RDC
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-light)', border: '1px solid var(--red)',
            borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem',
            fontSize: '0.85rem', color: 'var(--red)', fontWeight: 500,
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div>
            <label style={labelStyle}>Nom complet</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Jean Mutombo" style={inputStyle} autoComplete="name" />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="votre@email.com" style={inputStyle} autoComplete="email" />
          </div>

          {/* Rôle */}
          <div>
            <label style={labelStyle}>Vous êtes</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set('role', r)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit',
                  border: `1.5px solid ${form.role === r ? 'var(--blue)' : 'var(--border)'}`,
                  background: form.role === r ? 'var(--blue-light)' : 'var(--surface-2)',
                  color: form.role === r ? 'var(--blue)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Filière */}
          <div>
            <label style={labelStyle}>Filière</label>
            <select value={form.filiere} onChange={e => set('filiere', e.target.value)} style={inputStyle}>
              <option value="">Choisissez votre filière</option>
              {FILIERES.map(f => (
                <option key={f.slug} value={f.label}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>

          {/* Mot de passe */}
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.pass} onChange={e => set('pass', e.target.value)}
                placeholder="Minimum 6 caractères"
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <input
              type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
              placeholder="••••••••" style={inputStyle} autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--border)' : 'var(--blue)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '13px', fontSize: '0.95rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            marginTop: '0.25rem', transition: 'all 0.15s',
          }}>
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
      </div>

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
}
