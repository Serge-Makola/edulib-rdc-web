'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import type { Doc } from '@/types'

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [newDocs, setNewDocs] = useState<Doc[]>([])
  const [lastSeen, setLastSeen] = useState<number>(0)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    const saved = parseInt(localStorage.getItem('edulib_last_seen') || '0')
    setLastSeen(saved)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(10))
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Doc))
      setNewDocs(docs)
      const count = docs.filter(d => (d.createdAt as number) > lastSeen).length
      setUnread(count)
    })
    return unsub
  }, [lastSeen])

  function openNotif() {
    setNotifOpen(!notifOpen)
    setUserMenuOpen(false)
    setMenuOpen(false)
    if (!notifOpen) {
      const now = Date.now()
      localStorage.setItem('edulib_last_seen', String(now))
      setLastSeen(now)
      setUnread(0)
    }
  }

  function closeAll() {
    setNotifOpen(false)
    setUserMenuOpen(false)
  }

  async function handleLogout() {
    setUserMenuOpen(false)
    setMenuOpen(false)
    await logout()
    window.location.href = '/'
  }

  function timeAgo(ts: number) {
    const diff = Date.now() - ts
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (d > 0) return 'il y a ' + d + 'j'
    if (h > 0) return 'il y a ' + h + 'h'
    return 'à l\'instant'
  }

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: scrolled ? 'rgba(15,23,42,0.95)' : '#0f172a', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none', transition: 'all 0.2s' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', height: 60, display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/icons/icon-192.png" alt="EduLib RDC" width={34} height={34} style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.03em', whiteSpace: 'nowrap' as const }}>
            EduLib <span style={{ color: '#d97706' }}>RDC</span>
          </div>
        </Link>

        {/* Nav desktop */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 8, flex: 1 }} className="nav-desktop">
          {[{ href: '/', label: 'Accueil' }, { href: '/catalogue', label: 'Catalogue' }, { href: '/filieres', label: 'Filières' }, { href: '/about', label: 'À propos' }].map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' as const }}>{label}</Link>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>

          {/* Thème */}
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 9px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          {/* Cloche notifications */}
          {mounted && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={openNotif} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 9px', color: '#fff', cursor: 'pointer', fontSize: '1rem', position: 'relative' }}>
                🔔
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: 'min(320px, calc(100vw - 32px))', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden', zIndex: 300 }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>🔔 Nouveaux documents</span>
                    <button onClick={closeAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {newDocs.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun document récent</div>
                    ) : (
                      newDocs.map(doc => {
                        const isNew = (doc.createdAt as number) > lastSeen && lastSeen > 0
                        return (
                          <Link key={doc.id} href="/catalogue" onClick={closeAll} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', background: isNew ? 'rgba(37,99,235,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{doc.title}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{doc.filiere} · {doc.type}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{timeAgo(doc.createdAt as number)}</span>
                              {isNew && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', display: 'block' }} />}
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                    <Link href="/catalogue" onClick={closeAll} style={{ display: 'block', textAlign: 'center', color: 'var(--blue)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>Voir tout le catalogue →</Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          {!currentUser ? (
            <>
              <Link href="/login" className="nav-desktop" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)', whiteSpace: 'nowrap' as const }}>Connexion</Link>
              <Link href="/register" className="nav-desktop" style={{ background: 'var(--blue)', color: '#fff', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' as const }}>S&apos;inscrire</Link>
            </>
          ) : (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap' as const, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAdmin ? '🔐 Direction' : currentUser.name.split(' ')[0]} ▾
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, minWidth: 200, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 200 }}>
                  {isAdmin && (
                    <Link href="/espace-direction" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: '#d97706', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700, borderBottom: '1px solid var(--border)', background: 'rgba(217,119,6,0.05)' }}>🔐 Espace Direction</Link>
                  )}
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'var(--ink)', textDecoration: 'none', fontSize: '0.875rem' }}>👤 Mon espace</Link>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', color: 'var(--red)', background: 'none', border: 'none', borderTop: '1px solid var(--border)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>🚪 Déconnexion</button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => { setMenuOpen(!menuOpen); closeAll() }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 9px', color: '#fff', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }} className="nav-hamburger">☰</button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ href: '/', label: '🏠 Accueil' }, { href: '/catalogue', label: '📚 Catalogue' }, { href: '/filieres', label: '🎓 Filières' }, { href: '/about', label: 'ℹ️ À propos' }, { href: '/contact', label: '📩 Contact' }].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '11px 8px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{label}</Link>
          ))}
          {!currentUser ? (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '11px 8px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🔐 Connexion</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '11px 8px', fontSize: '0.9rem' }}>📝 S&apos;inscrire</Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link href="/espace-direction" onClick={() => setMenuOpen(false)} style={{ color: '#d97706', textDecoration: 'none', padding: '11px 8px', fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🔐 Espace Direction</Link>
              )}
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '11px 8px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>👤 Mon espace</Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--red)', padding: '11px 8px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>🚪 Déconnexion</button>
            </>
          )}
        </div>
      )}
      <style>{`
        @media(min-width:768px){.nav-hamburger{display:none!important}}
        @media(max-width:767px){.nav-desktop{display:none!important}}
      `}</style>
    </nav>
  )
}
