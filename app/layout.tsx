import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/wallet/WalletProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'CredLock — the double-pledge gate',
  description:
    'Before Creditcoin finances an RWA, CredLock forces a cryptographic clear-or-encumbered verdict from the source chain. Allow executes. Block reverts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <WalletProvider>
          <div className="carbon min-h-screen flex flex-col text-bone">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}
