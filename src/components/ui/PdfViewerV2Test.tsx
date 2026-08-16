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
        onReady={async (registry) => {
          console.log('[DEBUG EmbedPDF] onReady declenche')
          const engine = registry.getEngine?.()
          console.log('[DEBUG EmbedPDF] engine', engine)
          console.log('[DEBUG EmbedPDF] engine.options', JSON.stringify((engine as any)?.options))
          console.log('[DEBUG EmbedPDF] engine methods', Object.getOwnPropertyNames(Object.getPrototypeOf(engine || {})))
          console.log('[DEBUG EmbedPDF] registry methods', Object.getOwnPropertyNames(Object.getPrototypeOf(registry)))
          try {
            const result = await (engine as any)?.openDocumentUrl('https://edulib-rdc-web.vercel.app/api/pdf-proxy?id=13AVZwrNZEritMZhmdSzrr0vPDzHptCeZ')
            console.log('[DEBUG EmbedPDF] openDocumentUrl result', result)
          } catch (err) {
            console.error('[DEBUG EmbedPDF] openDocumentUrl error', err)
          }
        }}
      />
    </div>
  )
}
