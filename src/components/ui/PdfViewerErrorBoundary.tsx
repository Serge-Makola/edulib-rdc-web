'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  errorInfo: string | null
}

export default class PdfViewerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PdfViewerErrorBoundary] Erreur capturee:', error)
    console.error('[PdfViewerErrorBoundary] Stack:', errorInfo.componentStack)
    this.setState({ errorInfo: errorInfo.componentStack || null })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#0f172a', color: '#fff', padding: '2rem', overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Erreur de rendu du lecteur PDF (DEBUG)</h2>
          <p><strong>Message:</strong> {this.state.error.message}</p>
          <p style={{ marginTop: '1rem' }}><strong>Stack:</strong></p>
          <p>{this.state.error.stack}</p>
          {this.state.errorInfo && (
            <>
              <p style={{ marginTop: '1rem' }}><strong>Component stack:</strong></p>
              <p>{this.state.errorInfo}</p>
            </>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
