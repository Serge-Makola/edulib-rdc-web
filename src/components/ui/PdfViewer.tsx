'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

interface Props {
  driveLink: string
  title: string
  documentId: string
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
  itemForChar: number[]
}

function buildPageIndex(itemStrs: string[]): PageIndex {
  let text = ''
  const itemForChar: number[] = []
  itemStrs.forEach((str, itemIndex) => {
    const normalized = normalize(str)
    for (let i = 0; i < normalized.length; i++) itemForChar.push(itemIndex)
    text += normalized
    text += ' '
    itemForChar.push(-1)
  })
  return { text, itemForChar }
}

interface SearchMatch {
  pageNumber: number
  itemIndexes: number[]
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
      const it = index.itemForChar[i]
      if (it >= 0) covered.add(it)
    }
    matches.push({ pageNumber, itemIndexes: Array.from(covered) })
    from = idx + query.length
  }
  return matches
}

function PageCanvas({
  page,
  pageNumber,
  scale,
  darkMode,
  activeSearchQuery,
  registerRef,
  onHeightMeasured,
  onMarksUpdated,
  onTextItemsReady,
}: {
  page: PDFPageProxy
  pageNumber: number
  scale: number
  darkMode: boolean
  activeSearchQuery: string
  registerRef: (n: number, el: HTMLDivElement | null) => void
  onHeightMeasured: (n: number, height: number) => void
  onTextItemsReady: (n: number, itemStrs: string[]) => void
  onMarksUpdated: (n: number, marks: HTMLElement[]) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
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
        onHeightMeasured(pageNumber, viewport.height)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, scale, pageNumber])

  const lastRenderedScaleRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let renderTask: { promise: Promise<void>; cancel: () => void } | null = null

    ;(async () => {
      const container = textLayerRef.current
      if (!container) return

      // Garde-fou : si ce container a deja une couche de texte rendue pour
      // exactement ce scale, on ne detruit pas et reconstruit pas le DOM.
      // Evite qu'un re-render du parent (sans changement reel de page/scale)
      // ne casse une selection de texte en cours sur une page voisine.
      if (lastRenderedScaleRef.current === scale && container.childElementCount > 0) {
        return
      }

      const pdfjsLib = await import('pdfjs-dist')
      const viewport = page.getViewport({ scale })
      const textContent = await page.getTextContent()
      if (cancelled) return

      onTextItemsReady(
        pageNumber,
        (textContent.items as any[]).filter((it) => 'str' in it).map((it) => it.str)
      )

      container.innerHTML = ''
      container.style.setProperty('--scale-factor', String(scale))
      container.style.width = Math.floor(viewport.width) + 'px'
      container.style.height = Math.floor(viewport.height) + 'px'

      renderTask = (pdfjsLib as any).renderTextLayer({
        textContent,
        container,
        viewport,
        textDivs: [],
      })
      await renderTask!.promise
      if (!cancelled) lastRenderedScaleRef.current = scale
    })().catch((err: any) => {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Erreur de rendu texte page', pageNumber, err)
      }
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, scale, pageNumber])
  useEffect(() => {
    const container = textLayerRef.current
    if (!container) return
    const spans = container.querySelectorAll('span')
    const q = normalize(activeSearchQuery.trim())
    spans.forEach((span) => {
      const el = span as HTMLElement
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent || ''
      }
      const original = el.dataset.originalText
      if (!q) {
        if (el.innerHTML !== original) el.textContent = original
        return
      }
      const normalizedOriginal = normalize(original)
      const idx = normalizedOriginal.indexOf(q)
      if (idx === -1) {
        if (el.innerHTML !== original) el.textContent = original
        return
      }
      const before = original.slice(0, idx)
      const matchText = original.slice(idx, idx + q.length)
      const after = original.slice(idx + q.length)
      const escapeHtml = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      el.innerHTML =
        escapeHtml(before) +
        '<mark class="pdf-search-hit">' + escapeHtml(matchText) + '</mark>' +
        escapeHtml(after)
    })
    onMarksUpdated(pageNumber, Array.from(container.querySelectorAll('.pdf-search-hit')) as HTMLElement[])
  }, [activeSearchQuery, rendered])

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
        <div
          ref={textLayerRef}
          className="pdf-text-layer"
          style={{ position: 'absolute', inset: 0 }}
        />
      </div>
    </div>
  )
}

export default function PdfViewer({ driveLink, title, documentId, onClose }: Props) {
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

  // Reprise de lecture : page sauvegardee pour ce document et cet utilisateur,
  // proposee via un bandeau plutot qu'un saut automatique (choix explicite du produit).
  const [savedPage, setSavedPage] = useState<number | null>(null)
  const [resumeBannerVisible, setResumeBannerVisible] = useState(false)
  const currentPageRef = useRef<number>(1)
  const saveProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null)
  const pageIndexRef = useRef<Map<number, PageIndex>>(new Map())
  const pageMarksRef = useRef<Map<number, HTMLElement[]>>(new Map())
  const pageHeightsRef = useRef<Map<number, number>>(new Map())
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const driveId = useMemo(() => getDriveId(driveLink), [driveLink])

  // Lecture de la position sauvegardee, des que l'utilisateur et le document
  // sont connus. Independant du chargement du PDF lui-meme : on veut savoir
  // s'il faut proposer le bandeau de reprise le plus tot possible.
  useEffect(() => {
    if (!currentUser || !documentId) return
    let cancelled = false
    ;(async () => {
      try {
        const progressRef = doc(db, 'reading_progress', currentUser.uid + '_' + documentId)
        const snap = await getDoc(progressRef)
        if (cancelled || !snap.exists()) return
        const data = snap.data()
        const page = typeof data.page === 'number' ? data.page : null
        if (page && page > 1) {
          setSavedPage(page)
          setResumeBannerVisible(true)
        }
      } catch {
        // Echec silencieux : la lecture de la position sauvegardee n'est
        // qu'une amelioration de confort, elle ne doit jamais bloquer
        // l'ouverture normale du document.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentUser, documentId])
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [])
  const proxyUrl = driveId ? '/api/pdf-proxy?id=' + driveId : null

  const registerRef = useCallback((n: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(n, el)
      observerRef.current?.observe(el)
    }
  }, [])
  const handleHeightMeasured = useCallback((n: number, height: number) => {
    pageHeightsRef.current.set(n, height)
  }, [])
  const indexedPagesRef = useRef<Set<number>>(new Set())
  const handleTextItemsReady = useCallback((n: number, itemStrs: string[]) => {
    pageIndexRef.current.set(n, buildPageIndex(itemStrs))
    if (!indexedPagesRef.current.has(n)) {
      indexedPagesRef.current.add(n)
      setIndexProgress((prev) => ({ done: prev.done + 1, total: prev.total }))
    }
  }, [])
  const handleMarksUpdated = useCallback((n: number, marks: HTMLElement[]) => {
    pageMarksRef.current.set(n, marks)
  }, [])

  // Sauvegarde la page courante dans Firestore, avec un anti-rebond de 2s
  // pour n'ecrire qu'apres un arret reel de lecture, pas a chaque page
  // traversee pendant un scroll rapide.
  const saveProgress = useCallback((page: number) => {
    if (!currentUser || !documentId) return
    if (saveProgressTimeoutRef.current) clearTimeout(saveProgressTimeoutRef.current)
    saveProgressTimeoutRef.current = setTimeout(() => {
      const progressRef = doc(db, 'reading_progress', currentUser.uid + '_' + documentId)
      setDoc(progressRef, { page, documentId, userId: currentUser.uid, updatedAt: serverTimestamp() }).catch(() => {
        // Echec silencieux : ne doit jamais perturber la lecture en cours.
      })
    }, 2000)
  }, [currentUser, documentId])

  useEffect(() => {
    if (!currentUser || !proxyUrl) return
    let cancelled = false

    ;(async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js'

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
        setIndexProgress({ done: 0, total: pdf.numPages })
        setVisiblePages(new Set([1, 2]))
        setLoading(false)

        const page1 = await pdf.getPage(1)
        if (cancelled) return
        setPages((prev) => new Map(prev).set(1, page1))
        if (pdf.numPages >= 2) {
          const page2 = await pdf.getPage(2)
          if (cancelled) return
          setPages((prev) => new Map(prev).set(2, page2))
        }
        for (let n = 1; n <= pdf.numPages; n++) {
          if (cancelled) return
          try {
            const page = n === 1 ? page1 : await pdf.getPage(n)
            const textContent = await page.getTextContent()
            const itemStrs = (textContent.items as any[]).filter((it) => 'str' in it).map((it) => it.str)
            pageIndexRef.current.set(n, buildPageIndex(itemStrs))
            if (!indexedPagesRef.current.has(n)) {
              indexedPagesRef.current.add(n)
              setIndexProgress((prev) => ({ done: prev.done + 1, total: prev.total }))
            }
          } catch {}
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
        let bestRatio = 0
        let bestPage: number | null = null
        entries.forEach((entry) => {
          const n = Number((entry.target as HTMLElement).dataset.pageNumber)
          if (!n) return
          if (entry.isIntersecting) {
            setVisiblePages((prev) => (prev.has(n) ? prev : new Set(prev).add(n)))
            if (!pages.has(n)) {
              pdfRef.current?.getPage(n).then((page) => {
                setPages((prev) => (prev.has(n) ? prev : new Map(prev).set(n, page)))
              })
            }
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio
              bestPage = n
            }
          }
          // Volontairement: on ne decharge plus les pages qui sortent du
          // viewport. Une fois chargee, une page reste montee pour de bon,
          // afin qu'une selection de texte en cours sur une page ne soit
          // jamais interrompue par un demontage/remontage pendant le scroll.
        })
        // Sauvegarde la page la plus visible comme position de lecture,
        // seulement si elle a reellement change depuis la derniere fois.
        if (bestPage !== null && bestPage !== currentPageRef.current) {
          currentPageRef.current = bestPage
          saveProgress(bestPage)
        }
      },
      { root: containerRef.current, rootMargin: '200px 0px 200px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
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
      let sameePageIndex = 0
      for (let j = 0; j < wrapped; j++) {
        if (matches[j].pageNumber === match.pageNumber) sameePageIndex++
      }
      const pageMarks = pageMarksRef.current.get(match.pageNumber)
      const markEl = pageMarks?.[sameePageIndex]
      if (markEl) {
        markEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
      } else {
        const el = pageRefs.current.get(match.pageNumber)
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    },
    [matches]
  )

  const goToSavedPage = useCallback(() => {
    if (savedPage === null) return
    setResumeBannerVisible(false)
    // La page ciblee doit d'abord etre montee (visiblePages/pages) pour que
    // sa ref existe. On force son ajout, puis on scrolle une fois le DOM pret.
    setVisiblePages((prev) => (prev.has(savedPage) ? prev : new Set(prev).add(savedPage)))
    if (!pages.has(savedPage)) {
      pdfRef.current?.getPage(savedPage).then((page) => {
        setPages((prev) => (prev.has(savedPage) ? prev : new Map(prev).set(savedPage, page)))
      })
    }
    setTimeout(() => {
      const el = pageRefs.current.get(savedPage)
      el?.scrollIntoView({ block: 'start', behavior: 'auto' })
    }, 150)
  }, [savedPage, pages])

  if (mounted === false) return null
  if (!currentUser) {
    return createPortal(
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
    , document.body)
  }

  const barBg = darkMode ? '#1e293b' : '#fff'
  const barFg = darkMode ? '#fff' : '#0f172a'
  const btnBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'

  return createPortal(
    <div ref={rootRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .pdf-text-layer {
          overflow: hidden;
          opacity: 1;
          line-height: 1;
        }
        .pdf-text-layer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer span::selection {
          background: rgba(59, 130, 246, 0.4);
        }
        .pdf-text-layer .pdf-search-hit {
          background: rgba(250, 204, 21, 0.4);
          border-radius: 2px;
          color: inherit;
        }
      `}</style>
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

      {resumeBannerVisible && savedPage !== null && (
        <div
          style={{
            background: darkMode ? '#1e3a5f' : '#eff6ff',
            borderBottom: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap' as const,
            flexShrink: 0,
          }}
        >
          <span style={{ color: barFg, fontSize: '0.85rem' }}>
            Reprendre à la page {savedPage} ?
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={goToSavedPage}
              style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}
            >
              Reprendre
            </button>
            <button
              onClick={() => setResumeBannerVisible(false)}
              style={{ background: btnBg, color: barFg, border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}
            >
              Non merci
            </button>
          </div>
        </div>
      )}

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
                  style={{ height: pageHeightsRef.current.get(n) ?? 400, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? '#334155' : '#e2e8f0', fontSize: '0.75rem' }}
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
                activeSearchQuery={searchQuery}
                registerRef={registerRef}
                onHeightMeasured={handleHeightMeasured}
                onTextItemsReady={handleTextItemsReady}
                onMarksUpdated={handleMarksUpdated}
              />
            )
          })}
      </div>
    </div>
  , document.body)
}
