import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/AuthContext'
import AiSidebar from '@/components/ai/AiSidebar'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'EduLib RDC — Bibliothèque universitaire congolaise', template: '%s | EduLib RDC' },
  description: 'La première bibliothèque numérique universitaire de la République Démocratique du Congo.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'EduLib RDC' },
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
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="page-transition">
              {children}
            </div>
            <AiSidebar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
