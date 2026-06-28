'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useStats } from '@/hooks/useStats'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { FILIERES } from '@/types'
import { useState, useEffect, useRef } from 'react'
import PdfViewer from '@/components/ui/PdfViewer'
import type { Doc } from '@/types'

const typeColors: Record<string, string> = { 'Ouvrage': '#2563eb', 'Loi': '#7c3aed', 'Jurisprudence': '#0891b2', 'Syllabus': '#059669', 'Notes de cours': '#d97706', 'Exercice': '#dc2626', 'Examen': '#db2777', 'Article scientifique': '#6d28d9' }

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (target === 0 || started.current) return
    started.current = true
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

export default function HomePage() {
  const { userCount, docCount } = useStats()
  const { docs } = useDocs()
  const { currentUser, isAdmin } = useAuth()
  const [activeFiliere, setActiveFiliere] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewerDoc, setViewerDoc] = useState<Doc | null>(null)
  const [visible, setVisible] = useState(false)

  const animatedDocs = useCountUp(docCount)
  const animatedUsers = useCountUp(userCount)
  const animated13 = useCountUp(13)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      if (isAdmin) window.location.href = '/espace-direction'
      else window.location.hash = ''
    }
  }, [isAdmin])

  const recentDocs = docs.slice(0, 6)

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--surface-2)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          padding: 'clamp(3rem, 8vw, 6rem) 1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(217,119,6,0.05)', pointerEvents: 'none' }} />

          <div style={{
            maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'clamp(1fr, 1fr, 1fr)',
            gap: '2rem', alignItems: 'center',
          }}
            className="hero-grid">

            {/* Colonne gauche */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(217,119,6,0.15))',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 100, padding: '8px 20px', marginBottom: '1.5rem',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706', display: 'inline-block', boxShadow: '0 0 8px #d97706' }} />
                <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Bibliothèque numérique #1 en RDC</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.9rem, 5.5vw, 3.75rem)',
                fontWeight: 900, color: '#fff',
                letterSpacing: '-0.04em', lineHeight: 1.1,
                marginBottom: '1.25rem',
              }}>
                Accéder au savoir,<br />
                <em style={{ color: '#d97706', fontStyle: 'italic' }}>c&apos;est notre mission</em>
              </h1>

              <p style={{
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 520, lineHeight: 1.8, marginBottom: '1.75rem',
              }}>
                Ouvrages, syllabus, articles scientifiques, jurisprudences — les meilleures ressources académiques pour étudiants, professeurs et chercheurs de la République Démocratique du Congo.
              </p>

              <div style={{ borderLeft: '3px solid #d97706', paddingLeft: '1.25rem', marginBottom: '1.75rem' }}>
                <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
                  &quot;La quête du savoir et l&apos;étude des sciences sont des tâches infiniment nobles — mais{' '}
                  <strong style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'normal' }}>terriblement ardues.</strong>&quot;
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                <Link href="/catalogue" style={{ background: 'var(--blue)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}>
                  Parcourir le catalogue
                </Link>
                {!currentUser && (
                  <Link href="/register" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
                    Accéder gratuitement
                  </Link>
                )}
              </div>
            </div>

            {/* Colonne droite — Stats */}
            <div className="hero-stats" style={{ display: 'flex', flexDirection: 'row' as const, gap: '0.75rem', flexWrap: 'wrap' as const }}>
              {[
                { value: animatedDocs, label: 'DOCUMENTS', sub: 'Disponibles maintenant' },
                { value: '+' + FILIERES.length, label: 'FILIÈRES', sub: 'Facultés couvertes' },
                { value: animatedUsers, label: 'UTILISATEURS', sub: 'Font confiance à EduLib' },
              ].map(({ value, label, sub }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '1rem 1.25rem',
                  flex: '1 1 140px',
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RECHERCHE + FILTRES ── */}
        <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1.25rem 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: '0.875rem' }}>
            <div style={{ position: 'relative' as const }}>
              <span style={{ position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher un document, un auteur, une matière..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px 11px 42px',
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface-2)', color: 'var(--ink)',
                  fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <button onClick={() => setActiveFiliere('')} style={{
                background: activeFiliere === '' ? 'var(--blue)' : 'var(--surface-2)',
                color: activeFiliere === '' ? '#fff' : 'var(--text-muted)',
                border: '1px solid ' + (activeFiliere === '' ? 'var(--blue)' : 'var(--border)'),
                borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Tous</button>
              {FILIERES.map(({ slug, label, emoji }) => (
                <Link key={slug} href={'/filieres/' + slug} style={{
                  background: activeFiliere === slug ? 'var(--blue)' : 'var(--surface-2)',
                  color: activeFiliere === slug ? '#fff' : 'var(--text-muted)',
                  border: '1px solid ' + (activeFiliere === slug ? 'var(--blue)' : 'var(--border)'),
                  borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 500,
                  textDecoration: 'none', display: 'inline-block',
                }}>{emoji} {label}</Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ background: 'var(--surface)', padding: 'clamp(1.5rem, 4vw, 2.5rem) 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '📚', value: animatedDocs, label: 'Documents disponibles' },
              { icon: '👥', value: animatedUsers, label: 'Utilisateurs inscrits' },
              { icon: '🎓', value: '+' + FILIERES.length, label: 'Filières couvertes' },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface-2)', borderRadius: 14, padding: '1.1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DOCUMENTS RÉCENTS ── */}
        {recentDocs.length > 0 && (
          <section style={{ padding: 'clamp(2rem, 5vw, 3.5rem) 1.25rem' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' as const, gap: 8 }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>Documents récents</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Les dernières ressources ajoutées</p>
                </div>
                <Link href="/catalogue" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Voir tout →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '0.875rem' }}>
                {recentDocs.filter(d =>
                  (!activeFiliere || d.filiere?.toLowerCase() === activeFiliere) &&
                  (!searchQuery || d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || (d as any).prof?.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map(doc => {
                  const color = typeColors[doc.type] || '#64748b'
                  return (
                    <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 9, transition: 'all 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ background: color + '15', color, border: '1px solid ' + color + '25', borderRadius: 6, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700 }}>{doc.type}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: doc.prix === 0 ? '#22c55e' : 'var(--ink)' }}>{doc.prix === 0 ? 'Gratuit' : '$' + doc.prix}</span>
                      </div>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.title}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span>📚 {doc.filiere}</span>
                        <span>👤 {(doc as any).prof || (doc as any).professeur || 'Non renseigné'}</span>
                      </div>
                      <Link href={'/filieres/' + (doc.filiere?.toLowerCase() || '') + '#doc-' + doc.id} style={{ display: 'block', textAlign: 'center', background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 8, padding: '8px', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', marginTop: 3 }}>
                        Voir dans la filière →
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── FILIÈRES GRID ── */}
        <section style={{ padding: 'clamp(2rem, 5vw, 3.5rem) 1.25rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' as const, gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>Choisir votre filière</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Accédez directement aux ressources de votre domaine</p>
              </div>
              <Link href="/filieres" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Toutes les filières →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))', gap: '0.75rem' }}>
              {FILIERES.map(({ slug, label, emoji }) => (
                <Link key={slug} href={'/filieres/' + slug} style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '1.1rem 0.875rem',
                  textDecoration: 'none', textAlign: 'center', display: 'block',
                  color: 'var(--ink)', transition: 'all 0.18s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-light)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{emoji}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--ink)' }}>{label}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 1.25rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Prêt à <em style={{ color: '#d97706', fontStyle: 'italic' }}>exceller</em> ?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.75 }}>
              Rejoignez des milliers d&apos;étudiants, professeurs et chercheurs congolais qui utilisent EduLib RDC pour accéder aux meilleures ressources académiques.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {!currentUser ? (
                <>
                  <Link href="/register" style={{ background: '#d97706', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(217,119,6,0.35)' }}>
                    Créer un compte gratuit
                  </Link>
                  <Link href="/catalogue" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
                    Parcourir le catalogue
                  </Link>
                </>
              ) : (
                <Link href="/catalogue" style={{ background: '#d97706', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(217,119,6,0.35)' }}>
                  Parcourir le catalogue
                </Link>
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
      {viewerDoc && <PdfViewer driveLink={viewerDoc.driveLink} title={viewerDoc.title} onClose={() => setViewerDoc(null)} />}
    </div>
  )
}
