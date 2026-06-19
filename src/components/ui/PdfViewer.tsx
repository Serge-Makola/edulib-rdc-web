'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

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
  const driveId = getDriveId(driveLink)
  const previewUrl = driveId ? 'https://drive.google.com/file/d/' + driveId + '/preview' : driveLink
  const downloadUrl = driveId ? 'https://drive.google.com/uc?export=download&id=' + driveId : driveLink

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 380, width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🔒</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--ink)' }}>Connexion requise</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Tu dois etre connecte pour lire les documents EduLib RDC. C&apos;est gratuit et rapide.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <Link href="/login" style={{ background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              Se connecter
            </Link>
            <Link href="/register" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 10, padding: '12px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Creer un compte gratuit
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0f172a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', flexShrink: 0 }}>← Fermer</button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{title}</span>
        {driveId && (
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--blue)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Telecharger</a>
        )}
      </div>
      <iframe src={previewUrl} style={{ flex: 1, border: 'none', width: '100%', background: '#1e293b' }} allow="autoplay" title={title} />
    </div>
  )
}
