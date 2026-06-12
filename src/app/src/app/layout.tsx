import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'
import AiSidebar from '@/components/ai/AiSidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'EduLib RDC — Bibliothèque universitaire congolaise',
    template: '%s | EduLib RDC',
  },
  description: 'La première bibliothèque numérique universitaire de la République Démocratique du Congo. Accédez à des milliers de documents académiques pour vos études.',
  keywords: ['bibliothèque', 'RDC', 'Congo', 'université', 'documents', 'cours', 'droit', 'médecine'],
  authors: [{ name: 'Serge Makola', url: 'https://edulib-rdc-web.vercel.app' }],
  creator: 'Serge Makola',
  openGraph: {
    type: 'website',
    locale: 'fr_CD',
    url: 'https://edulib-rdc-web.vercel.app',
    siteName: 'EduLib RDC',
    title: 'EduLib RDC — Bibliothèque universitaire congolaise',
    description: 'La première bibliothèque numérique universitaire de la RDC.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduLib RDC',
    description: 'La première bibliothèque numérique universitaire de la RDC.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduLib RDC',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <AiSidebar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
