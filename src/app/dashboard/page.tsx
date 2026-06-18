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

  if (isLoading || !currentUser) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}><p style={{ color: 'var(--text-muted)' }}>Chargement...</p></div>

  const myDocs = docs.filter(d => currentUser.boughtIds?.includes(d.id) || d.prix === 0)
  const suggestions = docs.filter(d => d.filiere?.toLowerCase() === currentUser.filiere?.toLowerCase() && !currentUser.boughtIds?.includes(d.id) && d.prix > 0).slice(0, 4)

  const tabs = [{ id: 'bibliotheque', label: 'Ma bibliotheque', count: myDocs.length }, { id: 'commandes', label: 'Commandes', count: orders.length }, { id: 'profil', label: 'Profil', count: null }] as const

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(1.5rem, 3vw, 2.5rem) 1.25rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{currentUser.name.charAt(0).toUpperCase()}</div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Bonjour, {currentUser.name.split(' ')[0]} !</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 2 }}>{currentUser.role} - {currentUser.filiere}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent', border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {tab.label} {tab.count !== null && tab.count > 0 && <span style={{ background: 'var(--blue)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700, marginLeft: 4 }}>{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          {activeTab === 'bibliotheque' && (
            <div>
              {myDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: '0.75rem' }}>Bibliotheque vide</h3>
                  <Link href="/catalogue" style={{ background: 'var(--blue)', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>Parcourir le catalogue</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myDocs.map(doc => (
                    <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{doc.type} - {doc.filiere}</div>
                      </div>
                      <button onClick={() => setViewerDoc(doc)} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Lire</button>
                    </div>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>Suggeres pour vous</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.875rem' }}>
                    {suggestions.map(doc => (
                      <div key={doc.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', marginBottom: 4 }}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{doc.type}</div>
                        <Link href="/catalogue" style={{ display: 'block', background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 7, padding: '6px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Voir dans le catalogue</Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'commandes' && (
            <div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛒</div>
                  <h3 style={{ color: 'var(--ink)', fontWeight: 600 }}>Aucune commande</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>#{order.id.slice(-6).toUpperCase()}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{order.items?.map(i => i.title).join(', ')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700 }}>${order.total}</span>
                        <span style={{ background: order.status === 'Paye' ? 'var(--green-light)' : 'var(--gold-light)', color: order.status === 'Paye' ? '#166534' : '#92400e', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600 }}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profil' && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                {[{ label: 'Nom', value: currentUser.name }, { label: 'Email', value: currentUser.email }, { label: 'Role', value: currentUser.role }, { label: 'Filiere', value: currentUser.filiere }, { label: 'Documents', value: myDocs.length + ' document' + (myDocs.length !== 1 ? 's' : '') }].map(({ label, value }, i) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {viewerDoc && <PdfViewer driveLink={viewerDoc.driveLink} title={viewerDoc.title} onClose={() => setViewerDoc(null)} />}
    </div>
  )
}
