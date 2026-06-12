'use client'

import { useState } from 'react'
import { usePurchase } from '@/hooks/usePurchase'
import { useAuth } from '@/context/AuthContext'
import type { Doc } from '@/types'
import Link from 'next/link'

interface Props {
  doc: Doc
  onClose: () => void
  onSuccess: () => void
}

export default function PurchaseModal({ doc, onClose, onSuccess }: Props) {
  const { currentUser } = useAuth()
  const { initiatePurchase, loading } = usePurchase()
  const [step, setStep] = useState<'confirm' | 'payment' | 'done'>('confirm')
  const [orderId, setOrderId] = useState('')

  async function handleBuy() {
    const result = await initiatePurchase([doc])
    if (result) {
      setOrderId(result.orderId)
      setStep('payment')
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Bonjour EduLib RDC,\n\nJe souhaite acheter le document suivant :\n\n📄 *${doc.title}*\nFilière : ${doc.filiere}\nPrix : $${doc.prix}\n\nCommande #${orderId}\nNom : ${currentUser?.name}\nEmail : ${currentUser?.email}\n\nMerci de confirmer les instructions de paiement.`
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        padding: 'clamp(1.5rem, 4vw, 2rem)',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }}>

        {/* Étape 1 : Confirmation */}
        {step === 'confirm' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Acheter ce document</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '1rem', marginBottom: '1.25rem',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 6, lineHeight: 1.4 }}>
                {doc.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                {doc.type} · {doc.filiere} · {doc.professeur}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue)' }}>${doc.prix}</div>
            </div>

            <div style={{
              background: 'var(--blue-light)', border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem',
              fontSize: '0.82rem', color: 'var(--blue)', lineHeight: 1.6,
            }}>
              ℹ️ Le paiement se fait via <strong>Mobile Money</strong> (M-Pesa, Airtel Money, Orange Money) ou virement. Après confirmation, vous recevez l'accès immédiatement.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '11px', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Annuler</button>
              <button onClick={handleBuy} disabled={loading} style={{
                flex: 2, background: loading ? 'var(--border)' : 'var(--blue)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px', fontSize: '0.875rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>{loading ? 'Traitement...' : '🛒 Confirmer l\'achat'}</button>
            </div>
          </>
        )}

        {/* Étape 2 : Instructions de paiement */}
        {step === 'payment' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📲</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Commande créée
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Référence : <strong>#{orderId.slice(-8).toUpperCase()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { num: '1', text: `Envoyez $${doc.prix} sur l'un de ces numéros Mobile Money :` },
                { num: '2', text: 'Prenez une capture de votre reçu de paiement.' },
                { num: '3', text: 'Contactez-nous sur WhatsApp avec la capture et votre référence de commande.' },
              ].map(({ num, text }) => (
                <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--blue)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>{num}</div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>

            {/* Numéros Mobile Money */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px', marginBottom: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {[
                { label: 'M-Pesa', num: '+243 840 021 963', color: '#e4193a' },
                { label: 'Airtel Money', num: '+243 840 021 963', color: '#e4000f' },
                { label: 'Orange Money', num: '+243 840 021 963', color: '#ff6600' },
              ].map(({ label, num, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace' }}>{num}</span>
                </div>
              ))}
            </div>

            
              href={`https://wa.me/243840021963?text=${whatsappMessage}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center',
                background: '#25d366', color: '#fff',
                borderRadius: 10, padding: '13px',
                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                marginBottom: '0.75rem',
              }}
            >
              💬 Envoyer la preuve sur WhatsApp
            </a>

            <button onClick={() => { setStep('done'); onSuccess() }} style={{
              display: 'block', width: '100%',
              background: 'var(--surface-2)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 10,
              padding: '11px', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>J'ai envoyé le paiement</button>
          </>
        )}

        {/* Étape 3 : Confirmation finale */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h3 style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>
              En attente de confirmation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Votre commande est enregistrée. Dès réception de votre paiement, nous activons l'accès au document dans votre bibliothèque.
            </p>
            <Link href="/dashboard" onClick={onClose} style={{
              display: 'block', background: 'var(--blue)', color: '#fff',
              borderRadius: 10, padding: '12px', textAlign: 'center',
              fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            }}>Voir mes commandes</Link>
          </div>
        )}
      </div>
    </div>
  )
}
