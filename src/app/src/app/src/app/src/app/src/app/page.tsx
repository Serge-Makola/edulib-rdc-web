'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useStats } from '@/hooks/useStats'
import { useDocs } from '@/hooks/useDocs'
import { useAuth } from '@/context/AuthContext'
import { FILIERES } from '@/types'

export default function HomePage() {
  const { userCount, docCount } = useStats()
  const { docs } = useDocs()
  const { currentUser } = useAuth()
  const recentDocs = docs.slice(0, 6)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2d4a 100%)',
          padding: 'clamp(3rem, 8vw, 5rem) 1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 360, height: 360,
            borderRadius: '50%', background: 'rgba(37,99,235,0.08)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, left: -60, width: 280, height: 280,
            borderRadius: '50%', background: 'rgba(217,119,6,0.06)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 99, padding: '5px 14px', marginBottom: '1.5rem',
              color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Plateforme éducative congolaise
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 800, color: '#fff',
              letterSpacing: '-0.04em', lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}>
              Le savoir congolais,{' '}
              <span style={{ color: '#d97706' }}>accessible à tous</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 580, margin: '0 auto 2rem',
              lineHeight: 1.75,
            }}>
              La première bibliothèque numérique universitaire de la RDC. Syllabus, ouvrages, jurisprudence, notes de cours — tout ce dont tu as besoin pour réussir.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalogue" style={{
                background: 'var(--blue)', color: '#fff',
                padding: '13px 28px', borderRadius: 10,
                fontWeight: 700, fontSize: '0.95rem',
                textDecoration: 'none', display: 'inline-block',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
              }}>Parcourir le catalogue</Link>

              {!currentUser && (
                <Link href="/register" style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', padding: '13px 28px', borderRadius: 10,
                  fontWeight: 600, fontSize: '0.95rem',
                  textDecoration: 'none', display: 'inline-block',
                }}>S'inscrire gratuitement</Link>
              )}
            </div>

            <div style={{
              display: 'flex', gap: 'clamp(1.5rem, 4vw, 3rem)',
              justifyContent: 'center', flexWrap: 'wrap',
              marginTop: '3rem', paddingTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { value: docCount, label: 'Documents' },
                { value: userCount, label: 'Étudiants inscrits' },
                { value: FILIERES.length, label: 'Filières couvertes' },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>
                    {value.toLocaleString('fr-CD')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {recentDocs.length > 0 && (
          <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 1.25rem' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    Derniers documents
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                    Ajoutés récemment à la bibliothèque
                  </p>
                </div>
                <Link href="/catalogue" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  Voir tout →
                </Link>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                gap: '1rem',
              }}>
                {recentDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{
          padding: 'clamp(2.5rem, 5vw, 4rem) 1.25rem',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  Filières disponibles
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                  {FILIERES.length} facultés couvertes
                </p>
              </div>
              <Link href="/filieres" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                Toutes les filières →
              </Link>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
              gap: '0.875rem',
            }}>
              {FILIERES.map(({ slug, label, emoji }) => (
                <Link key={slug} href={`/filieres/${slug}`} style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '1.25rem 1rem',
                  textDecoration: 'none', textAlign: 'center',
                  transition: 'all 0.15s', display: 'block',
                  color: 'var(--ink)',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {!currentUser && (
          <section style={{
            padding: 'clamp(2.5rem, 5vw, 4rem) 1.25rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.875rem' }}>
                Rejoins {userCount.toLocaleString('fr-CD')} étudiants congolais
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
                Crée ton compte gratuitement et accède à toute la bibliothèque. Inscription en moins de 30 secondes.
              </p>
              <Link href="/register" style={{
                background: '#d97706', color: '#fff',
                padding: '14px 32px', borderRadius: 10,
                fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', display: 'inline-block',
                boxShadow: '0 4px 14px rgba(217,119,6,0.4)',
              }}>Créer un compte gratuit</Link>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  )
}

function DocCard({ doc }: { doc: any }) {
  const typeColors: Record<string, string> = {
    'Ouvrage': '#2563eb', 'Loi': '#7c3aed', 'Jurisprudence': '#0891b2',
    'Syllabus': '#059669', 'Notes de cours': '#d97706', 'Exercice': '#dc2626',
    'Examen': '#db2777', 'Article scientifique': '#6d28d9',
  }
  const color = typeColors[doc.type] || '#64748b'

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.15s', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          background: `${color}18`, color, border: `1px solid ${color}30`,
          borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
        }}>{doc.type}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: doc.prix === 0 ? '#22c55e' : 'var(--ink)' }}>
          {doc.prix === 0 ? 'Gratuit' : `${doc.prix} $`}
        </span>
      </div>
      <h3 style={{
        fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)',
        lineHeight: 1.4, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{doc.title}</h3>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>📚 {doc.filiere}</span>
        <span>👤 {doc.professeur}</span>
      </div>
      <Link href="/catalogue" style={{
        display: 'block', textAlign: 'center',
        background: 'var(--blue-light)', color: 'var(--blue)',
        borderRadius: 8, padding: '8px', fontSize: '0.8rem', fontWeight: 600,
        textDecoration: 'none', marginTop: 4,
      }}>Voir le document →</Link>
    </div>
  )
}
