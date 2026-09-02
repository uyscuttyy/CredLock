import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/wallet/WalletProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'CredLock — Portable Financial Reputation',
  description: 'Your financial history, verified across chains. CredLock turns your on-chain activity into verifiable financial credentials you can carry across ecosystems.',
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
          <div className="min-h-screen bg-brand-background flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}