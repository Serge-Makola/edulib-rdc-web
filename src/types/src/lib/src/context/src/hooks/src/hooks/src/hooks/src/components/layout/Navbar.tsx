'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(15,23,42,0.95)' : '#0f172a',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'all 0.2s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem',
        height: 60, display: 'flex', alignItems: 'center', gap: 16,
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', flexShrink: 0,
          }}>
            <Image src="/icons/icon-192.png" alt="EduLib RDC" width={36} height={36} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              EduLib <span style={{ color: '#d97706' }}>RDC</span>
            </div>
          </div>
        </Link>

        {/* Nav desktop */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8, flex: 1 }} className="nav-desktop">
          {[
            { href: '/', label: 'Accueil' },
            { href: '/catalogue', label: 'Catalogue' },
            { href: '/filieres', label: 'Filières' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
              padding: '6px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff', e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)', e.currentTarget.style.background = 'transparent')}
            >{label}</Link>
          ))}
        </div>

        {/* Actions droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>

          {/* Dark mode toggle */}
          <button onClick={toggleTheme} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer',
            fontSize: '0.9rem', lineHeight: 1,
          }} aria-label="Changer le thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {!currentUser ? (
            <>
              <Link href="/login" style={{
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)',
              }}>Connexion</Link>
              <Link href="/register" style={{
                background: 'var(--blue)', color: '#fff', textDecoration: 'none',
                padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
              }}>S'inscrire</Link>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{currentUser.name.split(' ')[0]}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▾</span>
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, minWidth: 180, boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden', zIndex: 200,
                }}>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)} style={{
                      display: 'block', padding: '12px 16px', color: 'var(--blue)',
                      textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                      borderBottom: '1px solid var(--border)',
                    }}>⚙️ Espace admin</Link>
                  )}
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} style={{
                    display: 'block', padding: '12px 16px', color: 'var(--ink)',
                    textDecoration: 'none', fontSize: '0.875rem',
                  }}>👤 Mon espace</Link>
                  <button onClick={() => { logout(); setUserMenuOpen(false) }} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 16px', color: 'var(--red)', background: 'none',
                    border: 'none', borderTop: '1px solid var(--border)',
                    fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}>🚪 Déconnexion</button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer',
            fontSize: '1rem', lineHeight: 1,
          }} className="nav-hamburger" aria-label="Menu">☰</button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{
          background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[
            { href: '/', label: '🏠 Accueil' },
            { href: '/catalogue', label: '📚 Catalogue' },
            { href: '/filieres', label: '🎓 Filières' },
            { href: '/about', label: 'ℹ️ À propos' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              padding: '12px 8px', fontSize: '0.95rem', fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>{label}</Link>
          ))}
          {!currentUser ? (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                padding: '12px 8px', fontSize: '0.95rem',
              }}>🔐 Connexion</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                padding: '12px 8px', fontSize: '0.95rem',
              }}>📝 S'inscrire</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                padding: '12px 8px', fontSize: '0.95rem',
              }}>👤 Mon espace</Link>
              <button onClick={() => { logout(); setMenuOpen(false) }} style={{
                background: 'none', border: 'none', textAlign: 'left',
                color: 'var(--red)', padding: '12px 8px', fontSize: '0.95rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>🚪 Déconnexion</button>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .nav-hamburger { display: none !important; } }
        @media (max-width: 767px) { .nav-desktop { display: none !important; } }
      `}</style>
    </nav>
  )
}
