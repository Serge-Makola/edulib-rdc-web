'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

interface PdfTextItem {
  str: string
  transform: number[]
  width: number
  height: number
}

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

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface PageIndex {
  text: string
  charMap: number[]
}

function buildPageIndex(items: PdfTextItem[]): PageIndex {
  let text = ''
  const charMap: number[] = []
  items.forEach((item, itemIndex) => {
    const normalized = normalize(item.str)
    for (let i = 0; i < normalized.length; i++) charMap.push(itemIndex)
    text += normalized
    text += ' '
    charMap.push(-1)
  })
  return { text, charMap }
}

interface SearchMatch {
  pageNumber: number
  itemIndexes: number[]
  charStart: number
}

function findMatchesInPage(index: PageIndex, query: string, pageNumber: number): SearchMatch[] {
  if (!query) return []
  const matches: SearchMatch[] = []
  let from = 0
  while (true) {
    const idx = index.text.indexOf(query, from)
    if (idx === -1) break
    const covered = new Set<number>()
    for (let i = idx; i < idx + query.length; i++) {
      const it = index.charMap[i]
      if (it >= 0) covered.add(it)
    }
    matches.push({ pageNumber, itemIndexes: Array.from(covered), charStart: idx })
    from = idx + query.length
  }
  return matches
}

interface HighlightRect {
  x: number
  y: number
  w: number
  h: number
}

function PageCanvas({
  page,
  pageNumber,
  scale,
  darkMode,
  highlights,
  registerRef,
  PdfjsUtil,
}: {
  page: PDFPageProxy
  pageNumber: number
  scale: number
  darkMode: boolean
  highlights: HighlightRect[]
  registerRef: (n: number, el: HTMLDivElement | null) => void
  PdfjsUtil: { transform: (m1: any, m2: any) => any[] }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const viewport = page.getViewport({ scale })
    const outputScale = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = Math.floor(viewport.width) + 'px'
    canvas.style.height = Math.floor(viewport.height) + 'px'
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

    const task = page.render({ canvasContext: context, viewport, transform })
    task.promise
      .then(() => {
        if (!cancelled) setRendered(true)
      })
      .catch((err: any) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Erreur de rendu page', pageNumber, err)
        }
      })

    return () => {
      cancelled = true
      task.cancel()
    }
  }, [page, scale, pageNumber])

  return (
    <div
      ref={(el) => registerRef(pageNumber, el)}
      data-page-number={pageNumber}
      style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
    >
      <div style={{ position: 'relative', boxShadow: '0 2px 14px rgba(0,0,0,0.28)', lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            filter: darkMode ? 'invert(0.92) hue-rotate(180deg)' : 'none',
            background: '#fff',
          }}
        />
        {!rendered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkMode ? '#64748b' : '#94a3b8',
              fontSize: '0.75rem',
            }}
          >
            Page {pageNumber}…
          </div>
        )}
        {highlights.map((h, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: h.x,
              top: h.y - 2,
              width: h.w,
              height: h.h + 4,
              background: 'rgba(250, 204, 21, 0.45)',
              outline: '2px solid rgba(234, 179, 8, 0.9)',
              pointerEvents: 'none',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function PdfViewer({ driveLink, title, onClose }: Props) {
  const { currentUser } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [scale, setScale] = useState(1.15)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pages, setPages] = useState<Map<number, PDFPageProxy>>(new Map())
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set())
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 })

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)

  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null)
  const pdfjsLibRef = useRef<any>(null)
  const pageIndexRef = useRef<Map<number, PageIndex>>(new Map())
  const pageItemsRef = useRef<Map<number, PdfTextItem[]>>(new Map())
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const driveId = useMemo(() => getDriveId(driveLink), [driveLink])
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
    }
  }, [])
  const proxyUrl = driveId ? '/api/pdf-proxy?id=' + driveId : null

  const registerRef = useCallback((n: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(n, el)
      observerRef.current?.observe(el)
    }
  }, [])

  useEffect(() => {
    if (!currentUser || !proxyUrl) return
    let cancelled = false

    ;(async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js'
        pdfjsLibRef.current = pdfjsLib

        const loadingTask = pdfjsLib.getDocument({
          url: proxyUrl,
          cMapUrl: '/pdf-worker/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdf-worker/standard_fonts/',
        })
        loadingTaskRef.current = loadingTask
        const pdf = await loadingTask.promise
        if (cancelled) return

        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setVisiblePages(new Set([1, 2]))
        setLoading(false)

        const preloaded = new Map<number, PDFPageProxy>()
        const page1 = await pdf.getPage(1)
        if (cancelled) return
        preloaded.set(1, page1)
        setPages((prev) => new Map(prev).set(1, page1))
        if (pdf.numPages >= 2) {
          const page2 = await pdf.getPage(2)
          if (cancelled) return
          preloaded.set(2, page2)
          setPages((prev) => new Map(prev).set(2, page2))
        }

        setIndexProgress({ done: 0, total: pdf.numPages })
        for (let n = 1; n <= pdf.numPages; n++) {
          if (cancelled) return
          const page = preloaded.get(n) ?? (await pdf.getPage(n))
          setPages((prev) => (prev.has(n) ? prev : new Map(prev).set(n, page)))
          setVisiblePages((prev) => (prev.has(n) ? prev : new Set(prev).add(n)))
          const content = await page.getTextContent()
          const items = content.items.filter((it) => 'str' in it) as unknown as PdfTextItem[]
          pageItemsRef.current.set(n, items)
          pageIndexRef.current.set(n, buildPageIndex(items))
          if (cancelled) return
          setIndexProgress({ done: n, total: pdf.numPages })
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || 'Impossible de charger le document')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      loadingTaskRef.current?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, proxyUrl])

  useEffect(() => {
    if (!numPages || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const n = Number((entry.target as HTMLElement).dataset.pageNumber)
          if (!n) return
          setVisiblePages((prev) => (prev.has(n) ? prev : new Set(prev).add(n)))
          if (!pages.has(n)) {
            pdfRef.current?.getPage(n).then((page) => {
              setPages((prev) => (prev.has(n) ? prev : new Map(prev).set(n, page)))
            })
          }
        })
      },
      { root: containerRef.current, rootMargin: '600px 0px 600px 0px' }
    )
    observerRef.current = observer
    pageRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages])

  useEffect(() => {
    const q = normalize(searchQuery.trim())
    if (!q) {
      setMatches([])
      setCurrentMatchIdx(0)
      return
    }
    const t = setTimeout(() => {
      const found: SearchMatch[] = []
      for (let n = 1; n <= numPages; n++) {
        const idx = pageIndexRef.current.get(n)
        if (idx) found.push(...findMatchesInPage(idx, q, n))
      }
      setMatches(found)
      setCurrentMatchIdx(0)
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery, indexProgress.done, numPages])

  const goToMatch = useCallback(
    (i: number) => {
      if (matches.length === 0) return
      const wrapped = ((i % matches.length) + matches.length) % matches.length
      setCurrentMatchIdx(wrapped)
      const match = matches[wrapped]
      const el = pageRefs.current.get(match.pageNumber)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
    [matches]
  )

  const highlightsForPage = useCallback(
    (pageNumber: number): HighlightRect[] => {
      if (matches.length === 0) return []
      const page = pages.get(pageNumber)
      const util = pdfjsLibRef.current?.Util
      if (!page || !util) return []
      const items = pageItemsRef.current.get(pageNumber)
      if (!items) return []
      const viewport = page.getViewport({ scale })
      const rects: HighlightRect[] = []
      matches.forEach((m) => {
        if (m.pageNumber !== pageNumber) return
        m.itemIndexes.forEach((itemIdx) => {
          const item = items[itemIdx]
          if (!item) return
          const tx = util.transform(viewport.transform, item.transform)
          const w = item.width * Math.hypot(tx[0], tx[1])
          const h = Math.hypot(tx[2], tx[3]) || item.height * scale
          rects.push({ x: tx[4], y: tx[5] - h, w, h })
        })
      })
      return rects
    },
    [matches, currentMatchIdx, pages, scale]
  )

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

  const barBg = darkMode ? '#1e293b' : '#fff'
  const barFg = darkMode ? '#fff' : '#0f172a'
  const btnBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: '100vh' }}>
      <div
        style={{
          background: barBg,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
          flexShrink: 0,
          flexWrap: 'wrap' as const,
          minHeight: 52,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button onClick={onClose} style={{ background: btnBg, border: 'none', color: barFg, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', flexShrink: 0, fontWeight: 600 }}>
          ← Fermer
        </button>

        <span style={{ color: barFg, fontWeight: 600, fontSize: '0.82rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>
          {title}
        </span>

        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.15))} title="Zoom arrière" style={{ background: btnBg, border: 'none', color: barFg, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
          −
        </button>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.15))} title="Zoom avant" style={{ background: btnBg, border: 'none', color: barFg, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
          +
        </button>

        <button
          onClick={() => setSearchOpen((v) => !v)}
          title="Rechercher dans le document"
          style={{ background: searchOpen ? 'var(--blue)' : btnBg, border: 'none', color: searchOpen ? '#fff' : barFg, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}
        >
          🔍
        </button>

        <button onClick={() => setDarkMode(!darkMode)} title="Mode sombre/clair" style={{ background: btnBg, border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        {searchOpen && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goToMatch(currentMatchIdx + (e.shiftKey ? -1 : 1))
                if (e.key === 'Escape') setSearchOpen(false)
              }}
              placeholder="Rechercher un mot ou une phrase…"
              style={{
                flex: 1,
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                border: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                borderRadius: 8,
                padding: '7px 10px',
                color: barFg,
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                minWidth: 0,
              }}
            />
            <span style={{ fontSize: '0.78rem', color: darkMode ? '#94a3b8' : '#64748b', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
              {matches.length > 0 ? currentMatchIdx + 1 + '/' + matches.length : indexProgress.done < indexProgress.total ? 'Indexation ' + indexProgress.done + '/' + indexProgress.total : '0 résultat'}
            </span>
            <button onClick={() => goToMatch(currentMatchIdx - 1)} disabled={matches.length === 0} style={{ background: btnBg, border: 'none', color: barFg, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', flexShrink: 0 }}>
              ↑
            </button>
            <button onClick={() => goToMatch(currentMatchIdx + 1)} disabled={matches.length === 0} style={{ background: btnBg, border: 'none', color: barFg, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', flexShrink: 0 }}>
              ↓
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 8px', WebkitOverflowScrolling: 'touch' as const }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.9rem' }}>
            Chargement du document…
          </div>
        )}
        {loadError && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#f87171', fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
            {loadError}
          </div>
        )}
        {!loading &&
          !loadError &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((n) => {
            const page = pages.get(n)
            if (!visiblePages.has(n) || !page) {
              return (
                <div
                  key={n}
                  ref={(el) => registerRef(n, el)}
                  data-page-number={n}
                  style={{ height: 400, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#334155' : '#e2e8f0', fontSize: '0.75rem' }}
                >
                  Page {n}
                </div>
              )
            }
            return (
              <PageCanvas
                key={n}
                page={page}
                pageNumber={n}
                scale={scale}
                darkMode={darkMode}
                highlights={highlightsForPage(n)}
                registerRef={registerRef}
                PdfjsUtil={pdfjsLibRef.current?.Util}
              />
            )
          })}
      </div>
    </div>
  )
}
