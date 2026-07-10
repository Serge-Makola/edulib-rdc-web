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
import PdfViewer from '@/components/ui/PdfViewer'
import PdfViewerErrorBoundary from '@/components/ui/PdfViewerErrorBoundary'
import type { Order, Doc } from '@/types'

export default function DashboardPage() {
  const { currentUser, isLoading } = useAuth()
  const { docs } = useDocs()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'bibliotheque' | 'commandes' | 'profil'>('bibliotheque')
  const [viewerDoc, setViewerDoc] = useState<Doc | null>(null)

  useEffect(() => { if (!isLoading && !currentUser) router.push('/login') }, [currentUser, isLoading, router])

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => { setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))) })
    return unsub
  }, [currentUser])

  if (isLoading || !currentUser) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
    </div>
  )

  const myDocs = docs.filter(d => currentUser.boughtIds?.includes(d.id) || d.prix === 0)
  const suggestions = docs.filter(d => d.filiere?.toLowerCase() === currentUser.filiere?.toLowerCase() && !currentUser.boughtIds?.includes(d.id) && d.prix > 0).slice(0, 4)
  const initials = currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(37,99,235,0.06)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.75rem', flexWrap: 'wrap' as const }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.3rem', flexShrink: 0, boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>{initials}</div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 4 }}>{currentUser.role} · {currentUser.filiere ? currentUser.filiere.charAt(0).toUpperCase() + currentUser.filiere.slice(1) : ''}</p>
              </div>
            </div>

            {/* Stats rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { icon: '📚', value: myDocs.length, label: 'Documents' },
                { icon: '🛒', value: orders.length, label: 'Commandes' },
                { icon: '🎓', value: currentUser.filiere ? currentUser.filiere.charAt(0).toUpperCase() + currentUser.filiere.slice(1) : '—', label: 'Filière' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
              {([
                { id: 'bibliotheque', label: '📖 Ma bibliothèque', count: myDocs.length },
                { id: 'commandes', label: '🛒 Commandes', count: orders.length },
                { id: 'profil', label: '👤 Profil', count: null },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700, marginLeft: 6 }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.25rem' }}>

          {/* BIBLIOTHÈQUE */}
          {activeTab === 'bibliotheque' && (
            <div>
              {myDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 700, marginBottom: '0.5rem' }}>Bibliothèque vide</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Les documents gratuits et achetés apparaissent ici.</p>
                  <Link href="/catalogue" style={{ background: 'var(--blue)', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Parcourir le catalogue</Link>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>{myDocs.length} document{myDocs.length > 1 ? 's' : ''} disponible{myDocs.length > 1 ? 's' : ''}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '0.875rem' }}>
                    {myDocs.map(doc => (
                      <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue-light), rgba(124,58,237,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📄</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{doc.type} · {doc.filiere}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: doc.prix === 0 ? '#22c55e' : 'var(--blue)', flexShrink: 0 }}>{doc.prix === 0 ? 'Gratuit' : '$' + doc.prix}</span>
                        </div>
                        <button onClick={() => setViewerDoc(doc)} style={{ background: 'linear-gradient(135deg, var(--blue), #1d4ed8)', color: '#fff', border: 'none', padding: '9px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                          📖 Lire le document
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>✨ Suggérés pour vous</h2>
                    <Link href="/catalogue" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.875rem' }}>
                    {suggestions.map(doc => (
                      <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>{doc.type} · {doc.filiere}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.875rem' }}>${doc.prix}</span>
                          <Link href="/catalogue" style={{ background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 7, padding: '5px 12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Obtenir →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMANDES */}
          {activeTab === 'commandes' && (
            <div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 700, marginBottom: '0.5rem' }}>Aucune commande</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Vos achats apparaîtront ici.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{orders.length} commande{orders.length > 1 ? 's' : ''}</h2>
                  {orders.map(order => (
                    <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 8 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'monospace' }}>#{order.id.slice(-8).toUpperCase()}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{order.items?.map(i => i.title).join(', ')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>${order.total}</span>
                          <span style={{ background: order.status === 'Payé' ? '#dcfce7' : '#fef9c3', color: order.status === 'Payé' ? '#166534' : '#92400e', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{order.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFIL */}
          {activeTab === 'profil' && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{initials}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{currentUser.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: 2 }}>{currentUser.email}</div>
                  </div>
                </div>
                {[
                  { label: 'Rôle', value: currentUser.role },
                  { label: 'Filière', value: currentUser.filiere ? currentUser.filiere.charAt(0).toUpperCase() + currentUser.filiere.slice(1) : '—' },
                  { label: 'Documents accessibles', value: myDocs.length + ' document' + (myDocs.length !== 1 ? 's' : '') },
                  { label: 'Commandes', value: orders.length + ' commande' + (orders.length !== 1 ? 's' : '') },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <Link href="/catalogue" style={{ display: 'block', background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                📚 Parcourir le catalogue
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {viewerDoc && <PdfViewerErrorBoundary onClose={() => setViewerDoc(null)}><PdfViewer driveLink={viewerDoc.driveLink} title={viewerDoc.title} onClose={() => setViewerDoc(null)} /></PdfViewerErrorBoundary>}
    </div>
  )
}
