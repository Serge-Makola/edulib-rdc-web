'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem', textAlign: 'center',
    }}>
      <Image src="/icons/icon-192.png" alt="EduLib RDC" width={64} height={64}
        style={{ objectFit: 'contain', borderRadius: 16, marginBottom: '1.5rem', opacity: 0.8 }} />

      <div style={{
        fontSize: 'clamp(4rem, 12vw, 7rem)', fontWeight: 900,
        color: 'transparent',
        backgroundImage: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        lineHeight: 1, marginBottom: '1rem',
      }}>404</div>

      <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
        Page introuvable
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', maxWidth: 380, lineHeight: 1.7, marginBottom: '2rem' }}>
        La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil pour continuer.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{
          background: 'var(--blue)', color: '#fff',
          padding: '12px 24px', borderRadius: 10,
          fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
        }}>🏠 Retour à l'accueil</Link>
        <Link href="/catalogue" style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', padding: '12px 24px', borderRadius: 10,
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
        }}>📚 Voir le catalogue</Link>
      </div>
    </div>
  )
}
