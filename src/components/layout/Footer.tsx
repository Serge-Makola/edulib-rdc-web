'use client'
import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ background: '#0f172a', color: 'rgba(255,255,255,0.6)', padding: '3rem 1.25rem 1.5rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: '0.875rem' }}>EduLib <span style={{ color: '#d97706' }}>RDC</span></div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 240 }}>La bibliothèque numérique de référence pour étudiants, professeurs et chercheurs universitaires en RDC.</p>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', textTransform: 'uppercase' as const }}>Navigation</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {[{ href: '/', label: 'Accueil' }, { href: '/catalogue', label: 'Catalogue' }, { href: '/filieres', label: 'Filières' }, { href: '/about', label: 'À propos' }, { href: '/contact', label: 'Contact' }].map(({ href, label }) => (
                <li key={href}><Link href={href} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', textTransform: 'uppercase' as const }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <a href="mailto:contact@edulibrdc.com" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>📧 contact@edulibrdc.com</a>
              <a href="tel:+243840021963" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>📞 +243 840 021 963</a>
              <a href="https://wa.me/243840021963" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>💬 WhatsApp</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem 0', margin: '0 0 1.5rem', textAlign: 'center' as const }}>
          <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 680, margin: '0 auto' }}>
            "La quête du savoir et l'étude des sciences sont des tâches infiniment nobles — mais terriblement ardues. C'est dans cette ardeur que se forge la grandeur."
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>— Philosophie d'EduLib RDC</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
          <span style={{ fontSize: '0.8rem' }}>© {year} EduLib RDC. Tous droits réservés.</span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>🇨🇩 Kinshasa, République Démocratique du Congo</span>
        </div>
      </div>
    </footer>
  )
}
