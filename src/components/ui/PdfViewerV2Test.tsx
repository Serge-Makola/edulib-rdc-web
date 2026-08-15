'use client'

import { PDFViewer } from '@embedpdf/react-pdf-viewer'

export default function PdfViewerV2Test() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <PDFViewer
        config={{
          src: 'https://snippet.embedpdf.com/ebook.pdf',
          theme: { preference: 'dark' },
        }}
      />
    </div>
  )
}
