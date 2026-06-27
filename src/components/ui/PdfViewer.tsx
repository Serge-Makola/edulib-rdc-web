'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

interface Props {
  driveLink: string
  title: string
  onClose: () => void
}

function getDriveId(link: string): string | null {
  const p1 = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (p1) return p1[1]
  const p2 = link.match(/id=([a-zA-Z0-9_-]+)/)
  if (p2) return p2[1]
  const p3 = link.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (p3) return p3[1]
  return null
}

export default function PdfViewer({ driveLink, title, onClose }: Props) {
  const { currentUser } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const driveId = getDriveId(driveLink)
  const previewUrl = driveId ? 'https://drive.google.com/file/d/' + driveId + '/preview' : driveLink

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 380, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🔒</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>Connexion requise</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Tu dois être connecté pour lire les documents EduLib RDC. C&apos;est gratuit et rapide.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <Link href="/login" style={{ background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Se connecter
            </Link>
            <Link href="/register" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Créer un compte gratuit
            </Link>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: darkMode ? '#0f172a' : '#f8fafc',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.2s',
    }}>
      {/* Barre du haut */}
      <div style={{
        background: darkMode ? '#1e293b' : '#fff',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        flexShrink: 0,
        flexWrap: 'wrap' as const,
        minHeight: 52,
      }}>
        <button onClick={onClose} style={{
          background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          border: 'none',
          color: darkMode ? '#fff' : '#0f172a',
          borderRadius: 8, padding: '7px 12px',
          cursor: 'pointer', fontSize: '0.82rem',
          fontFamily: 'inherit', flexShrink: 0, fontWeight: 600,
        }}>← Fermer</button>

        <span style={{
          color: darkMode ? '#fff' : '#0f172a',
          fontWeight: 600, fontSize: '0.82rem',
          flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          minWidth: 0,
        }}>{title}</span>

        <button onClick={() => setDarkMode(!darkMode)} title="Mode sombre/clair" style={{
          background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          border: 'none', borderRadius: 8, padding: '7px 10px',
          cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0,
        }}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Iframe lecteur */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <iframe
          src={previewUrl}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            border: 'none',
            background: darkMode ? '#1e293b' : '#f8fafc',
            filter: darkMode ? 'invert(0)' : 'none',
          }}
          allow="autoplay"
          title={title}
        />
      </div>
    </div>
  )
}
