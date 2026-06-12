'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: '#0f172a',
      color: 'rgba(255,255,255,0.6)',
      padding: '3rem 1.25rem 1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Top */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem',
        }}>

          {/* Colonne marque */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <Image src="/icons/icon-192.png" alt="EduLib RDC" width={32} height={32} style={{ objectFit: 'contain', borderRadius: 8 }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                EduLib <span style={{ color: '#d97706' }}>RDC</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 240 }}>
              La première bibliothèque numérique universitaire de la République Démocratique du Congo.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Navigation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/', label: 'Accueil' },
                { href: '/catalogue', label: 'Catalogue' },
                { href: '/filieres', label: 'Filières' },
                { href: '/about', label: 'À propos' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{
                    color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
                    fontSize: '0.875rem', transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Contact
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <a href="mailto:contact@edulibrdc.com" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>
                  ✉️ contact@edulibrdc.com
                </a>
              </li>
              <li>
                <a href="tel:+243840021963" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>
                  📞 +243 840 021 963
                </a>
              </li>
              <li>
                <a href="https://wa.me/243840021963" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>
                  💬 WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* À propos */}
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              À propos
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
              Fondé par Serge Makola, juriste et développeur congolais passionné par l'accès au savoir.
            </p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>
              Co-manager : Gloire Kisanga Josias
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8rem' }}>
            © {year} EduLib RDC — Tous droits réservés
          </span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
            Fait avec ❤️ à Kinshasa, RDC
          </span>
        </div>
      </div>
    </footer>
  )
}
