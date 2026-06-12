'use client'

import { use, useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { FILIERES, DOC_TYPES, type Doc } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function FilierePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const filiere = FILIERES.find(f => f.slug === slug)
  if (!filiere) notFound()

  const { docs, loading } = useDocs()
  const { currentUser } = useAuth()
  const [selectedType, setSelectedType] = useState('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = docs.filter(d => d.filiere === filiere.label)
    if (selectedType) list = list.filter(d => d.type === selectedType)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.professeur.toLowerCase().includes(q)
      )
    }
    return list
  }, [docs, filiere.label, selectedType, query])

  const typeColors: Record<string, string> = {
    'Ouvrage': '#2563eb', 'Loi': '#7c3aed', 'Jurisprudence': '#0891b2',
    'Syllabus': '#059669', 'Notes de cours': '#d97706', 'Exercice': '#dc2626',
    'Examen': '#db2777', 'Article scientifique': '#6d28d9',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* En-tête */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Link href="/filieres" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.75rem' }}>
              ← Toutes les filières
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem',
              }}>{filiere.emoji}</div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                  {filiere.label}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 2 }}>
                  {loading ? '...' : `${docs.filter(d => d.filiere === filiere.label).length} documents disponibles`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

          {/* Filtres */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '1rem', marginBottom: '1.5rem',
            display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>🔍</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  width: '100%', padding: '8px 12px 8px 32px',
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--surface-2)', color: 'var(--ink)',
                  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{
                flex: '1 1 150px', padding: '8px 12px',
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--surface-2)', color: 'var(--ink)',
                fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <option value="">Tous les types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Résultats */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: '0.5rem' }}>Aucun document trouvé</h3>
              <p style={{ fontSize: '0.875rem' }}>Aucun document ne correspond à vos critères pour cette filière.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {filtered.length} document{filtered.length > 1 ? 's' : ''}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
                gap: '1rem',
              }}>
                {filtered.map(doc => {
                  const color = typeColors[doc.type] || '#64748b'
                  const owned = currentUser?.boughtIds?.includes(doc.id) || doc.prix === 0
                  return (
                    <div key={doc.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: '1.25rem',
                      display: 'flex', flexDirection: 'column', gap: 10,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{
                          background: `${color}18`, color, border: `1px solid ${color}30`,
                          borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
                        }}>{doc.type}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: doc.prix === 0 ? '#22c55e' : 'var(--ink)' }}>
                          {doc.prix === 0 ? 'Gratuit' : `$${doc.prix}`}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{doc.title}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>👤 {doc.professeur}</span>
                        {doc.annee && <span>📅 {doc.annee}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {owned ? (
                          <a href={`https://drive.google.com/file/d/${extractDriveId(doc.driveLink)}/preview`}
                            target="_blank" rel="noopener noreferrer" style={{
                              flex: 1, background: 'var(--blue)', color: '#fff',
                              borderRadius: 8, padding: '8px', textAlign: 'center',
                              fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                            }}>👁️ Lire</a>
                        ) : !currentUser ? (
                          <Link href="/login" style={{
                            flex: 1, background: 'var(--blue-light)', color: 'var(--blue)',
                            borderRadius: 8, padding: '8px', textAlign: 'center',
                            fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                          }}>🔐 Se connecter</Link>
                        ) : (
                          <button style={{
                            flex: 1, background: 'var(--gold-light)', color: 'var(--gold)',
                            border: '1px solid var(--gold)', borderRadius: 8, padding: '8px',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}>🛒 Acheter ${doc.prix}</button>
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
    </div>
  )
}

function extractDriveId(link: string): string {
  const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : link
}
