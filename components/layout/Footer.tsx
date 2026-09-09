'use client'

import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-carbon-950">
      <div className="container-custom grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4"><Logo compact /></div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ash">
            Before Creditcoin lends against an RWA, CredLock forces a cryptographic
            clear-or-encumbered result from the source chain. The second financing
            cannot complete. The contract refuses it.
          </p>
        </div>

        <div>
          <p className="mb-3 font-sans font-semibold text-bone">Product</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gate" className="text-ash hover:text-bullion-pale transition-colors">The gate</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-sans font-semibold text-bone">Protocol</p>
          <ul className="space-y-2 text-sm">
            <li><a href="https://creditcoin.org" target="_blank" rel="noopener noreferrer" className="text-ash hover:text-bullion-pale transition-colors">Creditcoin</a></li>
            <li><a href="https://attestcoin.org" target="_blank" rel="noopener noreferrer" className="text-ash hover:text-bullion-pale transition-colors">Attestcoin</a></li>
            <li><a href="https://docs.attestcoin.org" target="_blank" rel="noopener noreferrer" className="text-ash hover:text-bullion-pale transition-colors">Attestcoin docs</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom flex flex-col justify-between gap-1 py-4 font-mono text-xs text-ash md:flex-row">
          <p>© 2026 CredLock. Built for the Creditcoin BUIDL CTC hackathon.</p>
          <p>Enforced on-chain, not in this interface.</p>
        </div>
      </div>
    </footer>
  )
}
