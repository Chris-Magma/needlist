import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import PendingGate from '@/components/PendingGate'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Needlist',
  description: 'Your personal product wishlist',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp|Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          <PendingGate>{children}</PendingGate>
        </AuthProvider>
      </body>
    </html>
  )
}
