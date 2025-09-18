import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

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
}
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
