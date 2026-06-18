'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useStats } from '@/hooks/useStats'

export default function AboutPage() {
  const { userCount, docCount } = useStats()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 'clamp(2.5rem, 5vw, 4rem) 1.25rem' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '1rem' }}>A propos d'EduLib RDC</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.75 }}>La premiere plateforme congolaise de ressources pedagogiques et scientifiques.</p>
          </div>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(2rem, 4vw, 3.5rem) 1.25rem' }}>
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.85, fontSize: '0.95rem' }}>EduLib RDC est la premiere plateforme congolaise de ressources pedagogiques et scientifiques, dediee aux etudiants, enseignants et chercheurs de la Republique Democratique du Congo. Notre vision est de democratiser l'acces au savoir et de valoriser la production intellectuelle congolaise.</p>
          </section>
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.875rem' }}>Notre mission</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.85, fontSize: '0.95rem' }}>Nous facilitons l'acces aux ressources pedagogiques et scientifiques de qualite pour tous, quelle que soit leur universite ou leur localisation en RDC. Nous offrons egalement aux enseignants et aux chercheurs une plateforme pour publier et valoriser leurs travaux.</p>
          </section>
          <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', textAlign: 'center' as const }}>
            {[{ value: docCount, label: 'Documents disponibles' }, { value: userCount, label: 'Etudiants inscrits' }, { value: 13, label: 'Filieres couvertes' }].map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </section>
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Notre equipe</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {[{ name: 'Serge Makola', role: 'Fondateur & Developpeur', emoji: '👨‍💻' }, { name: 'Gloire Kisanga Josias', role: 'Gestionnaire de contenu & Publications', emoji: '📚' }].map(({ name, role, emoji }) => (
                <div key={name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 600, marginTop: 2 }}>{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.875rem' }}>Contact</h2>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📧 contact@edulibrdc.com</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📞 +243 840 021 963</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 Kinshasa, RDC</p>
              <a href="https://wa.me/243840021963" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>💬 WhatsApp</a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
