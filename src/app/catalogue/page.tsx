'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { DOC_TYPES, type Doc } from '@/types'
import { useFilieres } from '@/hooks/useFilieres'
import Link from 'next/link'
import PdfViewer from '@/components/ui/PdfViewer'

const typeColors: Record<string, string> = { 'Ouvrage': '#2563eb', 'Loi': '#7c3aed', 'Jurisprudence': '#0891b2', 'Syllabus': '#059669', 'Notes de cours': '#d97706', 'Exercice': '#dc2626', 'Examen': '#db2777', 'Article scientifique': '#6d28d9' }

export default function CataloguePage() {
  const { docs, loading, search } = useDocs()
  const { currentUser, isLoading } = useAuth()
  const { filieres: FILIERES } = useFilieres()
  const [query, setQuery] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'prix-asc' | 'prix-desc' | 'titre'>('recent')
  const [viewerDoc, setViewerDoc] = useState<Doc | null>(null)

  const results = useMemo(() => {
    let list = search(query, selectedFiliere || undefined, selectedType || undefined)
    switch (sortBy) {
      case 'prix-asc': return [...list].sort((a, b) => a.prix - b.prix)
      case 'prix-desc': return [...list].sort((a, b) => b.prix - a.prix)
      case 'titre': return [...list].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
      default: return list
    }
  }, [docs, query, selectedFiliere, selectedType, sortBy])

  const sel: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Catalogue</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>{loading ? '...' : docs.length + ' documents disponibles'}</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap' as const, gap: '0.875rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>RECHERCHER</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>🔍</span>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Titre, professeur..." style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>FILIERE</label>
              <select value={selectedFiliere} onChange={e => setSelectedFiliere(e.target.value)} style={sel}>
                <option value="">Toutes</option>
                {FILIERES.map(f => <option key={f.slug} value={f.label}>{f.emoji} {f.label}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TYPE</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={sel}>
                <option value="">Tous</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TRIER PAR</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={sel}>
                <option value="recent">Plus recents</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix decroissant</option>
                <option value="titre">Titre A-Z</option>
              </select>
            </div>
            {(query || selectedFiliere || selectedType) && (
              <button onClick={() => { setQuery(''); setSelectedFiliere(''); setSelectedType('') }} style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 8, padding: '9px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end' }}>Effacer</button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, height: 200, opacity: 0.5 }} />)}
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ color: 'var(--ink)', fontWeight: 600 }}>Aucun resultat</h3>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{results.length} resultat{results.length > 1 ? 's' : ''}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '1rem' }}>
                {results.map(doc => {
                  const color = typeColors[doc.type] || '#64748b'
                  const isFree = doc.prix === 0
                  const owned = currentUser?.boughtIds?.includes(doc.id) || isFree
                  return (
                    <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ background: color + '15', color, border: '1px solid ' + color + '25', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600 }}>{doc.type}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isFree ? '#22c55e' : 'var(--ink)' }}>{isFree ? 'Gratuit' : '$' + doc.prix}</span>
                      </div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.title}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span>📚 {doc.filiere}</span>
                        <span>👤 {(doc as any).prof || (doc as any).professeur || 'Non renseigne'}</span>
                        {(doc as any).annee && <span>📅 {(doc as any).annee}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {owned ? (
                          <button onClick={() => { if (!isLoading) setViewerDoc(doc) }} style={{ flex: 1, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Lire</button>
                        ) : !currentUser ? (
                          <Link href="/login" style={{ flex: 1, background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
                        ) : (
                          <button style={{ flex: 1, background: 'var(--gold-light)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 8, padding: '9px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Acheter ${doc.prix}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      {viewerDoc && <PdfViewer driveLink={viewerDoc.driveLink} title={viewerDoc.title} onClose={() => setViewerDoc(null)} />}
    </div>
  )
}
