import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { driveLink } = await req.json()
    if (!driveLink) return NextResponse.json({ error: 'driveLink manquant' }, { status: 400 })

    const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                  driveLink.match(/id=([a-zA-Z0-9_-]+)/) ||
                  driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!match) return NextResponse.json({ error: 'Lien Drive invalide' }, { status: 400 })

    const driveId = match[1]
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`

    const pdfRes = await fetch(downloadUrl)
    if (!pdfRes.ok) return NextResponse.json({ error: 'Impossible de télécharger' }, { status: 400 })

    const buffer = await pdfRes.arrayBuffer()

    // Polyfills nécessaires
    if (typeof globalThis.DOMMatrix === 'undefined') {
      (globalThis as any).DOMMatrix = class {
        static fromMatrix() { return new (globalThis as any).DOMMatrix() }
        invertSelf() { return this }
        multiplySelf() { return this }
        translateSelf() { return this }
        scaleSelf() { return this }
        rotateSelf() { return this }
        transformPoint(p: any) { return p }
        a=1;b=0;c=0;d=1;e=0;f=0
      }
    }
    if (typeof globalThis.Path2D === 'undefined') {
      (globalThis as any).Path2D = class {}
    }
    if (typeof globalThis.OffscreenCanvas === 'undefined') {
      (globalThis as any).OffscreenCanvas = class {
        constructor(public width: number, public height: number) {}
        getContext() { return null }
      }
    }

    // Import pdfjs et désactiver complètement le worker
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs') as any
    pdfjs.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
    
    // Forcer le mode sans worker
    const { getDocument } = pdfjs
    const uint8 = new Uint8Array(buffer)
    
    const loadingTask = getDocument({
      data: uint8,
      worker: null,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      disableRange: true,
      disableStream: true,
      verbosity: 0,
      isOffscreenCanvasSupported: false,
      canvasFactory: null,
    })

    const doc = await loadingTask.promise
    let text = ''
    const maxPages = Math.min(doc.numPages, 40)

    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => item.str || '').join(' ') + '\n'
      } catch {}
    }

    const cleaned = text.replace(/\s+/g, ' ').trim().slice(0, 8000)
    if (cleaned.length < 50) return NextResponse.json({ error: 'PDF scanné', text: '' })

    return NextResponse.json({ text: cleaned, pages: doc.numPages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
