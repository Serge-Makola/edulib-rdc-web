'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/context/AuthContext'

export default function ContactPage() {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    sujet: '',
    message: '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.sujet || !form.message) return
    setLoading(true)
    // Ouvrir le client email avec les données pré-remplies
    const subject = encodeURIComponent(`[EduLib RDC] ${form.sujet}`)
    const body = encodeURIComponent(
      `Nom : ${form.name}\nEmail : ${form.email}\n\n${form.message}`
    )
    window.open(`mailto:contact@edulibrdc.com?subject=${subject}&body=${body}`)
    setTimeout(() => { setSent(true); setLoading(false) }, 500)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>

        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Contact
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
              Une question ? Une suggestion ? On vous répond.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

            {/* Formulaire */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Envoyer un message
              </h2>

              {sent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Message préparé</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    Votre client email s'est ouvert avec le message pré-rempli. Envoyez-le depuis votre boîte mail.
                  </p>
                  <button onClick={() => setSent(false)} style={{
                    marginTop: '1.25rem', background: 'var(--blue-light)', color: 'var(--blue)',
                    border: 'none', borderRadius: 8, padding: '9px 18px',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Envoyer un autre message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label style={lbl}>Nom *</label>
                      <input value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="Votre nom" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Email *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="votre@email.com" style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Sujet *</label>
                    <select value={form.sujet} onChange={e => set('sujet', e.target.value)} style={inp}>
                      <option value="">Choisir un sujet</option>
                      <option value="Question générale">Question générale</option>
                      <option value="Problème technique">Problème technique</option>
                      <option value="Proposition de document">Proposer un document</option>
                      <option value="Partenariat">Partenariat</option>
                      <option value="Paiement">Question sur le paiement</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Message *</label>
                    <textarea value={form.message} onChange={e => set('message', e.target.value)}
                      placeholder="Décrivez votre demande..." rows={5}
                      style={{ ...inp, resize: 'vertical' as const }} />
                  </div>
                  <button type="submit" disabled={loading || !form.name || !form.email || !form.sujet || !form.message}
                    style={{
                      background: loading || !form.name || !form.email || !form.sujet || !form.message
                        ? 'var(--border)' : 'var(--blue)',
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '12px', fontSize: '0.9rem', fontWeight: 700,
                      cursor: !form.name || !form.email || !form.sujet || !form.message ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                    {loading ? 'Ouverture...' : '✉️ Envoyer le message'}
                  </button>
                </form>
              )}
            </div>

            {/* Infos de contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Autres moyens de contact</h2>

              {[
                {
                  icon: '💬',
                  label: 'WhatsApp',
                  value: '+243 840 021 963',
                  desc: 'Réponse rapide — disponible du lundi au samedi',
                  href: 'https://wa.me/243840021963',
                  color: '#25d366',
                },
                {
                  icon: '✉️',
                  label: 'Email',
                  value: 'contact@edulibrdc.com',
                  desc: 'Réponse sous 24-48h',
                  href: 'mailto:contact@edulibrdc.com',
                  color: 'var(--blue)',
                },
                {
                  icon: '📞',
                  label: 'Téléphone',
                  value: '+243 840 021 963',
                  desc: 'Disponible en journée, heure de Kinshasa (UTC+1)',
                  href: 'tel:+243840021963',
                  color: 'var(--ink)',
                },
              ].map(({ icon, label, value, desc, href, color }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer" style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '1.125rem',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'var(--surface-2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 3 }}>{value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </a>
              ))}

              {/* Localisation */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '1.125rem',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'var(--surface-2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                }}>📍</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)', marginBottom: 2 }}>Localisation</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 3 }}>Kinshasa, RDC</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Plateforme 100% en ligne — accessible depuis toute la RDC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 5,
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--surface-2)', color: 'var(--ink)',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
}
