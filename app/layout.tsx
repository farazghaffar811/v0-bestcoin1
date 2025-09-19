import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// ✅ Correct path to your component
import DisableZoom from "@/components/DisableZoom"

export const metadata: Metadata = {
  title: 'BEST',
  description: 'High Level Trading Platform',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: 'https://res.cloudinary.com/dwnt025iw/image/upload/v1758170169/favicon_l1kb1v.png',
        type: 'image/png',
        sizes: '32x32',
      },
    ],
  },
  // You can keep this if you want, but we’ll also force a meta tag below
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: 'no',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* ✅ Explicit meta viewport to guarantee mobile browsers respect it */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* ✅ This script blocks pinch & double-tap zoom */}
        <DisableZoom />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
