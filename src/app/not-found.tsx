'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(4rem, 12vw, 7rem)', fontWeight: 900, color: '#2563eb', lineHeight: 1, marginBottom: '1rem' }}>404</div>
      <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Page introuvable</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', maxWidth: 380, lineHeight: 1.7, marginBottom: '2rem' }}>La page que vous cherchez n'existe pas.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ background: 'var(--blue)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Accueil</Link>
        <Link href="/catalogue" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>Catalogue</Link>
      </div>
    </div>
  )
}
