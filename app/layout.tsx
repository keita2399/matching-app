import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

const GA_ID = 'G-DRZDTMMCH3'

export const metadata: Metadata = {
  title: 'マッチングアプリ',
  description: '安心・安全なマッチングプラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.variable}>
      <body className="min-h-screen">
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
