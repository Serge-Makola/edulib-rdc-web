import { existsSync, mkdirSync, cpSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pdfjsDist = path.join(root, 'node_modules', 'pdfjs-dist')
const target = path.join(root, 'public', 'pdf-worker')

if (!existsSync(pdfjsDist)) {
  console.warn('[copy-pdf-worker] pdfjs-dist introuvable, etape ignoree.')
  process.exit(0)
}

mkdirSync(target, { recursive: true })
cpSync(path.join(pdfjsDist, 'build', 'pdf.worker.min.mjs'), path.join(target, 'pdf.worker.min.mjs'))

const cmapsSrc = path.join(pdfjsDist, 'cmaps')
if (existsSync(cmapsSrc)) cpSync(cmapsSrc, path.join(target, 'cmaps'), { recursive: true })

const fontsSrc = path.join(pdfjsDist, 'standard_fonts')
if (existsSync(fontsSrc)) cpSync(fontsSrc, path.join(target, 'standard_fonts'), { recursive: true })

console.log('[copy-pdf-worker] worker + cmaps/fonts copies dans public/pdf-worker/')
