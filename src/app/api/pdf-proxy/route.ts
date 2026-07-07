import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function fetchDriveFile(id: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const baseUrl = `https://drive.google.com/uc?export=download&id=${id}`

  let res = await fetch(baseUrl, { redirect: 'follow' })
  let contentType = res.headers.get('content-type') || ''

  if (contentType.includes('text/html')) {
    const html = await res.text()
    const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/)
    const cookie = res.headers.get('set-cookie') || ''

    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${id}`
      res = await fetch(confirmUrl, {
        redirect: 'follow',
        headers: cookie ? { cookie } : undefined,
      })
      contentType = res.headers.get('content-type') || 'application/pdf'
    } else {
      throw new Error('Google Drive a renvoye une page de confirmation sans token exploitable')
    }
  }

  if (!res.ok) {
    throw new Error(`Echec du telechargement Drive (${res.status})`)
  }

  const buffer = await res.arrayBuffer()
  return { buffer, contentType: contentType.includes('pdf') ? contentType : 'application/pdf' }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'id manquant ou invalide' }, { status: 400 })
  }

  try {
    const { buffer, contentType } = await fetchDriveFile(id)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur de recuperation du document' }, { status: 502 })
  }
}
