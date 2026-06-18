'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', sujet: '', message: '' })
  const [sent, setSent] = useState(false)
  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent('[EduLib RDC] ' + form.sujet)
    const body = encodeURIComponent('Nom : ' + form.name + '\nEmail : ' + form.email + '\n\n' + form.message)
    window.open('mailto:contact@edulibrdc.com?subject=' + subject + '&body=' + body)
    setSent(true)
  }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2rem, 4vw, 3rem) 1.25rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Contact</h1>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Envoyer un message</h2>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Message prepare</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Votre client email s'est ouvert. Envoyez depuis votre boite mail.</p>
                  <button onClick={() => setSent(false)} style={{ marginTop: '1rem', background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Nouveau message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Nom</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Votre nom" style={inp} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="votre@email.com" style={inp} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Sujet</label>
                    <select value={form.sujet} onChange={e => set('sujet', e.target.value)} style={inp}>
                      <option value="">Choisir un sujet</option>
                      <option>Question generale</option>
                      <option>Probleme technique</option>
                      <option>Proposer un document</option>
                      <option>Partenariat</option>
                      <option>Paiement</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Message</label><textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Votre message..." rows={5} style={{ ...inp, resize: 'vertical' as const }} /></div>
                  <button type="submit" style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Envoyer</button>
                </form>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Autres contacts</h2>
              {[{ icon: '💬', label: 'WhatsApp', value: '+243 840 021 963', href: 'https://wa.me/243840021963' }, { icon: '📧', label: 'Email', value: 'contact@edulibrdc.com', href: 'mailto:contact@edulibrdc.com' }, { icon: '📍', label: 'Localisation', value: 'Kinshasa, RDC', href: '#' }].map(({ icon, label, value, href }) => (
                <a key={label} href={href} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', transition: 'all 0.15s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
