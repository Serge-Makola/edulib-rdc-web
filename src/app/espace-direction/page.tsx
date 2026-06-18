'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDocs } from '@/hooks/useDocs'
import { db } from '@/lib/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { FILIERES, DOC_TYPES, type User, type Order } from '@/types'

const EMPTY = { title: '', filiere: '', type: '', prof: '', prix: '', annee: '', desc: '', driveLink: '' }

export default function EspaceDirectionPage() {
  const { firebaseUser, isAdmin, isLoading } = useAuth()
  const { docs } = useDocs()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'dashboard' | 'docs' | 'users' | 'orders'>('dashboard')
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [docSearch, setDocSearch] = useState('')

  useEffect(() => { if (!isLoading && (!firebaseUser || !isAdmin)) router.push('/') }, [firebaseUser, isAdmin, isLoading, router])

  useEffect(() => {
    if (!isAdmin) return
    const u1 = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), s => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() } as User))))
    const u2 = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))))
    return () => { u1(); u2() }
  }, [isAdmin])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  function setField(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }
  function resetForm() { setForm(EMPTY); setEditId(null) }

  function startEdit(d: any) {
    setForm({ title: d.title, filiere: d.filiere, type: d.type, prof: d.prof || '', prix: String(d.prix), annee: d.annee || '', desc: d.desc || '', driveLink: d.driveLink })
    setEditId(d.id); setTab('docs')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveDoc() {
    const { title, filiere, type, prof, prix, driveLink } = form
    if (!title || !filiere || !type || !prof || prix === '' || !driveLink) { showToast('Remplissez tous les champs *'); return }
    setSaving(true)
    try {
      const data = { title: title.trim(), filiere: filiere.toLowerCase(), type, prof: prof.trim(), prix: Number(prix), annee: form.annee.trim(), desc: form.desc.trim(), driveLink: driveLink.trim(), createdAt: Date.now(), downloads: 0 }
      if (editId) { await updateDoc(doc(db, 'documents', editId), data); showToast('Document modifie') }
      else { await addDoc(collection(db, 'documents'), data); showToast('Document publie') }
      resetForm()
    } catch (e: any) { showToast('Erreur : ' + e.message) } finally { setSaving(false) }
  }

  async function deleteDocById(id: string, title: string) {
    if (!confirm('Supprimer "' + title + '" ?')) return
    try { await deleteDoc(doc(db, 'documents', id)); showToast('Document supprime') } catch (e: any) { showToast('Erreur : ' + e.message) }
  }

  if (isLoading || !isAdmin) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Verification des acces...</p></div>

  const filteredDocs = docSearch ? docs.filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase())) : docs
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', borderRadius: 10, padding: '12px 22px', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 9999, whiteSpace: 'nowrap' as const }}>{toast}</div>}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', marginBottom: '1rem' }}>Espace Direction — EduLib RDC</h1>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
            {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'docs', label: 'Documents' }, { id: 'users', label: 'Utilisateurs (' + users.length + ')' }, { id: 'orders', label: 'Commandes (' + orders.length + ')' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} style={{ background: tab === t.id ? 'rgba(255,255,255,0.15)' : 'transparent', border: tab === t.id ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.45)', borderRadius: 8, padding: '7px 16px', fontSize: '0.85rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[{ label: 'Documents', value: docs.length, color: '#2563eb' }, { label: 'Utilisateurs', value: users.length, color: '#059669' }, { label: 'Commandes', value: orders.length, color: '#d97706' }, { label: 'Revenus', value: '$' + orders.filter(o => o.status === 'Payé').reduce((s, o) => s + o.total, 0), color: '#7c3aed' }].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color, letterSpacing: '-0.04em' }}>{value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--ink)' }}>5 derniers documents</h3>
              {docs.slice(0, 5).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.filiere} - {d.type}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: d.prix === 0 ? '#22c55e' : 'var(--ink)' }}>{d.prix === 0 ? 'Gratuit' : '$' + d.prix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'docs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>{editId ? 'Modifier' : 'Ajouter un document'}</h3>
                {editId && <button onClick={resetForm} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>Annuler</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.875rem' }}>
                <div><label style={lbl}>Titre *</label><input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Titre du document" style={inp} /></div>
                <div><label style={lbl}>Filiere *</label>
                  <select value={form.filiere} onChange={e => setField('filiere', e.target.value)} style={inp}>
                    <option value="">Choisir</option>
                    {FILIERES.map(f => <option key={f.slug} value={f.slug}>{f.emoji} {f.label}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Type *</label>
                  <select value={form.type} onChange={e => setField('type', e.target.value)} style={inp}>
                    <option value="">Choisir</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Professeur *</label><input value={form.prof} onChange={e => setField('prof', e.target.value)} placeholder="Nom du professeur" style={inp} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>Prix ($) *</label><input type="number" min="0" value={form.prix} onChange={e => setField('prix', e.target.value)} placeholder="0" style={inp} /></div>
                  <div><label style={lbl}>Annee</label><input value={form.annee} onChange={e => setField('annee', e.target.value)} placeholder="2024-2025" style={inp} /></div>
                </div>
                <div><label style={lbl}>Lien Google Drive *</label><input value={form.driveLink} onChange={e => setField('driveLink', e.target.value)} placeholder="https://drive.google.com/..." style={inp} /><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Drive - clic droit - Obtenir le lien - Toute personne</p></div>
                <div><label style={lbl}>Description</label><textarea value={form.desc} onChange={e => setField('desc', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' as const }} /></div>
                <button onClick={saveDoc} disabled={saving} style={{ background: saving ? 'var(--border)' : 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Publier le document'}
                </button>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>{docs.length} documents</h3>
                <input value={docSearch} onChange={e => setDocSearch(e.target.value)} placeholder="Filtrer..." style={{ ...inp, width: 160, padding: '7px 12px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.625rem', maxHeight: '72vh', overflowY: 'auto' }}>
                {filteredDocs.map(d => (
                  <div key={d.id} style={{ background: editId === d.id ? 'var(--blue-light)' : 'var(--surface)', border: '1px solid ' + (editId === d.id ? 'var(--blue)' : 'var(--border)'), borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{d.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{d.filiere} - {d.type} - {d.prix === 0 ? 'Gratuit' : '$' + d.prix}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(d)} style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
                      <button onClick={() => deleteDocById(d.id, d.title)} style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Sup</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.625rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>{users.length} utilisateurs</h3>
            {users.map(u => (
              <div key={u.uid} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{u.name?.charAt(0) || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} - {u.role}</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.filiere}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.625rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>{orders.length} commandes</h3>
            {orders.map(o => (
              <div key={o.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>{o.userName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.items?.map(i => i.title).join(', ')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700 }}>${o.total}</span>
                  <span style={{ background: o.status === 'Payé' ? 'var(--green-light)' : 'var(--gold-light)', color: o.status === 'Payé' ? '#166534' : '#92400e', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600 }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
