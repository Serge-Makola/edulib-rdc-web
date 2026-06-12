'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { DOC_TYPES, FILIERES, type Doc } from '@/types'
import Link from 'next/link'

export default function CataloguePage() {
  const { docs, loading, search } = useDocs()
  const { currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'prix-asc' | 'prix-desc' | 'titre'>('recent')

  const results = useMemo(() => {
    let list = search(query, selectedFiliere || undefined, selectedType || undefined)
    switch (sortBy) {
      case 'prix-asc':  return [...list].sort((a,b) => a.prix - b.prix)
      case 'prix-desc': return [...list].sort((a,b) => b.prix - a.prix)
      case 'titre':     return [...list].sort((a,b) => a.title.localeCompare(b.title, 'fr'))
      default:          return list
    }
  }, [docs, query, selectedFiliere, selectedType, sortBy])

  const freeCount = results.filter(d => d.prix === 0).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* ── EN-TÊTE ── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Catalogue
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
              {loading ? '...' : `${docs.length} documents disponibles`}
              {freeCount > 0 && !loading && <span style={{ marginLeft: 10, color: '#4ade80' }}>· {freeCount} gratuits</span>}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

          {/* ── FILTRES ── */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem',
            display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'flex-end',
          }}>

            {/* Recherche */}
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                RECHERCHER
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Titre, professeur, matière..."
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface-2)', color: 'var(--ink)',
                    fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Filière */}
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>FILIÈRE</label>
              <select value={selectedFiliere} onChange={e => setSelectedFiliere(e.target.value)} style={selectStyle}>
                <option value="">Toutes</option>
                {FILIERES.map(f => <option key={f.slug} value={f.label}>{f.emoji} {f.label}</option>)}
              </select>
            </div>

            {/* Type */}
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TYPE</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Tri */}
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TRIER PAR</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={selectStyle}>
                <option value="recent">Plus récents</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
                <option value="titre">Titre A→Z</option>
              </select>
            </div>

            {/* Reset */}
            {(query || selectedFiliere || selectedType) && (
              <button onClick={() => { setQuery(''); setSelectedFiliere(''); setSelectedType('') }} style={{
                background: 'var(--red-light)', color: 'var(--red)',
                border: '1px solid var(--red)', borderRadius: 8,
                padding: '9px 14px', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                alignSelf: 'flex-end',
              }}>✕ Effacer</button>
            )}
          </div>

          {/* ── RÉSULTATS ── */}
          {loading ? (
            <LoadingGrid />
          ) : results.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <>
              <p style={{ fontSize: '0.8rem
