'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClose: () => void
}

interface State {
  hasError: boolean
}

export default class PdfViewerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PdfViewerErrorBoundary] Erreur capturee:', error)
    console.error('[PdfViewerErrorBoundary] Stack:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 380, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem' }}>📄</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>Ce document n&apos;a pas pu s&apos;afficher</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.65 }}>
              Une erreur est survenue lors de l&apos;ouverture de ce document. Essaie de le rouvrir, ou choisis un autre document.
            </p>
            <button
              onClick={this.props.onClose}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
