'use client'

import { use, useState, useMemo, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { FILIERES, DOC_TYPES, type Doc } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PdfViewer from '@/components/ui/PdfViewer'

const typeColors: Record<string, string> = {
  'Ouvrage': '#2563eb', 'Loi': '#7c3aed', 'Jurisprudence': '#0891b2',
  'Syllabus': '#059669', 'Notes de cours': '#d97706', 'Exercice': '#dc2626',
  'Examen': '#db2777', 'Article scientifique': '#6d28d9', 'Autres': '#64748b'
}

const typeEmojis: Record<string, string> = {
  'Ouvrage': '📘', 'Loi': '⚖️', 'Jurisprudence': '🏛️',
  'Syllabus': '📋', 'Notes de cours': '📝', 'Exercice': '✏️',
  'Examen': '📄', 'Article scientifique': '🔬', 'Autres': '📁'
}

export default function FilierePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const filiere = FILIERES.find(f => f.slug === slug)
  if (!filiere) notFound()

  const { docs, loading } = useDocs()
  const { currentUser } = useAuth()
  const [selectedType, setSelectedType] = useState('')
  const [query, setQuery] = useState('')
  const [viewerDoc, setViewerDoc] = useState<Doc | null>(null)

  useEffect(() => {
    if (loading) return
    const hash = window.location.hash
    if (!hash) return
    const id = hash.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.boxShadow = '0 0 0 3px var(--blue)'
        setTimeout(() => { el.style.boxShadow = '' }, 2000)
      }, 300)
    }
  }, [loading])

  const filtered = useMemo(() => {
    let list = docs.filter(d => d.filiere?.toLowerCase() === filiere.slug)
    if (selectedType) list = list.filter(d => d.type === selectedType)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(d => d.title.toLowerCase().includes(q) || (d as any).prof?.toLowerCase().includes(q))
    }
    return list
  }, [docs, filiere.slug, selectedType, query])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Link href="/filieres" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' }}>← Toutes les filières</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>{filiere.emoji}</div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{filiere.label}</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 2 }}>{loading ? '...' : filtered.length + ' document' + (filtered.length !== 1 ? 's' : '')}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          {/* Filtres */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>🔍</span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ flex: '1 1 150px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="">Tous les types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: 'var(--ink)', fontWeight: 600 }}>Aucun document trouvé</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
              {filtered.map(doc => {
                const color = typeColors[doc.type] || '#64748b'
                const emoji = typeEmojis[doc.type] || '📄'
                const isFree = doc.prix === 0
                const owned = currentUser?.boughtIds?.includes(doc.id) || isFree
                return (
                  <div key={doc.id} id={'doc-' + doc.id}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = color + '40' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    {/* Header coloré */}
                    <div style={{ background: color + '15', borderBottom: '1px solid ' + color + '20', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem' }}>{emoji}</div>
                      <span style={{ background: color + '20', color, border: '1px solid ' + color + '30', borderRadius: 99, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700 }}>{doc.type}</span>
                    </div>

                    {/* Contenu */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{doc.title}</h3>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                        <span>👤 {(doc as any).prof || (doc as any).professeur || 'Non renseigné'}</span>
                        {(doc as any).annee && <span>📅 {(doc as any).annee}</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isFree ? '#22c55e' : 'var(--ink)' }}>{isFree ? 'Gratuit' : '$' + doc.prix}</span>
                        {owned ? (
                          <button onClick={() => setViewerDoc(doc)} style={{ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Lire</button>
                        ) : !currentUser ? (
                          <Link href="/login" style={{ background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Connexion</Link>
                        ) : (
                          <button style={{ background: 'var(--gold-light)', color: '#92400e', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Acheter</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {viewerDoc && <PdfViewer driveLink={viewerDoc.driveLink} title={viewerDoc.title} onClose={() => setViewerDoc(null)} />}
    </div>
  )
}
