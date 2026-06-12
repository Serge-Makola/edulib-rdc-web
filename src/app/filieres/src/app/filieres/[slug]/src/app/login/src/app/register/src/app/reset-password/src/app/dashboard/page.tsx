'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDocs } from '@/hooks/useDocs'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import type { Order, Doc } from '@/types'

export default function DashboardPage() {
  const { currentUser, isLoading } = useAuth()
  const { docs } = useDocs()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'bibliotheque' | 'commandes' | 'profil'>('bibliotheque')

  useEffect(() => {
    if (!isLoading && !currentUser) router.push('/login')
  }, [currentUser, isLoading, router])

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
    })
    return unsub
  }, [currentUser])

  if (isLoading || !currentUser) {
    return <LoadingScreen />
  }

  // Documents achetés
  const myDocs = docs.filter(d => currentUser.boughtIds?.includes(d.id) || d.prix === 0)
  const myFiliereDocs = docs.filter(d => d.filiere === currentUser.filiere && !currentUser.boughtIds?.includes(d.id) && d.prix > 0)

  const tabs = [
    { id: 'bibliotheque', label: '📚 Ma bibliothèque', count: myDocs.length },
    { id: 'commandes', label: '🛒 Commandes', count: orders.length },
    { id: 'profil', label: '👤 Profil', count: null },
  ] as const

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* En-tête */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(1.5rem, 3vw, 2.5rem) 1.25rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: 'var(--blue)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.2rem', color: '#fff', fontWeight: 700,
              }}>{currentUser.name.charAt(0).toUpperCase()}</div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  Bonjour, {currentUser.name.split(' ')[0]} 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 2 }}>
                  {currentUser.role} · {currentUser.filiere}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span style={{
                      background: 'var(--blue)', color: '#fff',
                      borderRadius: 99, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700,
                    }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

          {/* ── Tab: Ma bibliothèque ── */}
          {activeTab === 'bibliotheque' && (
            <div>
              {myDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: '0.75rem' }}>Bibliothèque vide</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Vous n'avez pas encore de documents. Explorez le catalogue pour en trouver.
                  </p>
                  <Link href="/catalogue" style={{
                    background: 'var(--blue)', color: '#fff',
                    padding: '10px 24px', borderRadius: 8,
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                  }}>Parcourir le catalogue</Link>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
                    Mes documents ({myDocs.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myDocs.map(doc => (
                      <DashDocRow key={doc.id} doc={doc} />
                    ))}
                  </div>
                </>
              )}

              {/* Suggestions filière */}
              {myFiliereDocs.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                    Suggérés pour vous — {currentUser.filiere}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Documents de votre filière que vous n'avez pas encore
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.875rem' }}>
                    {myFiliereDocs.slice(0, 4).map(doc => (
                      <SuggestionCard key={doc.id} doc={doc} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Commandes ── */}
          {activeTab === 'commandes' && (
            <div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: '0.75rem' }}>Aucune commande</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vos commandes apparaîtront ici.</p>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
                    Historique des commandes
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map(order => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tab: Profil ── */}
          {activeTab === 'profil' && (
            <div style={{ maxWidth: 480 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Informations du profil
              </h2>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                {[
                  { label: 'Nom', value: currentUser.name },
                  { label: 'Email', value: currentUser.email },
                  { label: 'Rôle', value: currentUser.role },
                  { label: 'Filière', value: currentUser.filiere },
                  { label: 'Documents', value: `${myDocs.length} document${myDocs.length !== 1 ? 's' : ''}` },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px',
                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ── Doc row ───────────────────────────────────────────────────
function DashDocRow({ doc }: { doc: Doc }) {
  const driveId = doc.driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
      }}>📄</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {doc.type} · {doc.filiere}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {driveId && (
          <a href={`https://drive.google.com/file/d/${driveId}/preview`} target="_blank" rel="noopener noreferrer" style={{
            background: 'var(--blue)', color: '#fff',
            padding: '6px 14px', borderRadius: 7, fontSize: '0.78rem',
            fontWeight: 600, textDecoration: 'none',
          }}>👁️ Lire</a>
        )}
        {driveId && (
          <a href={`https://drive.google.com/uc?export=download&id=${driveId}`} target="_blank" rel="noopener noreferrer" style={{
            background: 'var(--surface-2)', color: 'var(--ink)',
            border: '1px solid var(--border)',
            padding: '6px 12px', borderRadius: 7, fontSize: '0.78rem',
            fontWeight: 600, textDecoration: 'none',
          }}>⬇️</a>
        )}
      </div>
    </div>
  )
}

// ── Suggestion card ───────────────────────────────────────────
function SuggestionCard({ doc }: { doc: Doc }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '1rem',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{doc.title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type} · ${doc.prix}</div>
      <Link href="/catalogue" style={{
        background: 'var(--blue-light)', color: 'var(--blue)',
        borderRadius: 7, padding: '6px', textAlign: 'center',
        fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
      }}>Voir dans le catalogue →</Link>
    </div>
  )
}

// ── Order row ─────────────────────────────────────────────────
function OrderRow({ order }: { order: Order }) {
  const statusColors: Record<string, { bg: string; color: string }> = {
    'Payé': { bg: 'var(--green-light)', color: '#166534' },
    'En attente de paiement': { bg: 'var(--gold-light)', color: '#92400e' },
    'Annulé': { bg: 'var(--red-light)', color: '#991b1b' },
  }
  const sc = statusColors[order.status] || statusColors['En attente de paiement']
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          Commande #{order.id.slice(-6).toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>
          {order.items?.map(i => i.title).join(', ')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>${order.total}</span>
        <span style={{
          background: sc.bg, color: sc.color,
          borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
        }}>{order.status}</span>
      </div>
    </div>
  )
}

// ── Loading screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p>Chargement...</p>
      </div>
    </div>
  )
}
