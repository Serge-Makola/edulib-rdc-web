'use client'

import { PDFViewer } from '@embedpdf/react-pdf-viewer'

export default function PdfViewerV2Test() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <PDFViewer
        config={{
          src: 'https://edulib-rdc-web.vercel.app/api/pdf-proxy?id=13AVZwrNZEritMZhmdSzrr0vPDzHptCeZ',
          theme: { preference: 'dark' },
        }}
      />
    </div>
  )
}
