import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { driveLink } = await req.json()
    if (!driveLink) return NextResponse.json({ error: 'driveLink manquant' }, { status: 400 })

    // Extraire l'ID Google Drive
    const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                  driveLink.match(/id=([a-zA-Z0-9_-]+)/) ||
                  driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!match) return NextResponse.json({ error: 'Lien Drive invalide' }, { status: 400 })

    const driveId = match[1]
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`

    // Télécharger le PDF
    const pdfRes = await fetch(downloadUrl)
    if (!pdfRes.ok) return NextResponse.json({ error: 'Impossible de télécharger le PDF' }, { status: 400 })

    const buffer = await pdfRes.arrayBuffer()
    const pdfBuffer = Buffer.from(buffer)

    // Extraire le texte
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(pdfBuffer)

    // Nettoyer et tronquer le texte (max 8000 caractères pour Firestore)
    const text = data.text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F]/g, ' ')
      .trim()
      .slice(0, 8000)

    return NextResponse.json({ text, pages: data.numpages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
