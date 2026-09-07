'use client'

import Link from 'next/link'

export const Footer = () => {
  return (
    <footer className="border-t border-brand-hairline">
      <div className="container-custom grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-bold">CredLock</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted">
            Before Creditcoin lends against an RWA, CredLock forces a cryptographic
            clear-or-encumbered result from the source chain. The second financing
            cannot complete — the contract refuses it.
          </p>
        </div>

        <div>
          <p className="mb-3 font-semibold">Product</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gate" className="text-brand-muted hover:text-brand-primary">The gate</Link></li>
            <li><Link href="/verify" className="text-brand-muted hover:text-brand-primary">Verify wallet</Link></li>
            <li><Link href="/credentials" className="text-brand-muted hover:text-brand-primary">Credentials</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold">Protocol</p>
          <ul className="space-y-2 text-sm">
            <li><a href="https://creditcoin.org" target="_blank" rel="noopener noreferrer" className="text-brand-muted hover:text-brand-primary">Creditcoin</a></li>
            <li><a href="https://attestcoin.org" target="_blank" rel="noopener noreferrer" className="text-brand-muted hover:text-brand-primary">Attestcoin</a></li>
            <li><a href="https://docs.attestcoin.org" target="_blank" rel="noopener noreferrer" className="text-brand-muted hover:text-brand-primary">Attestcoin docs</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-hairline">
        <div className="container-custom flex flex-col justify-between gap-1 py-4 text-xs text-brand-muted md:flex-row">
          <p>© 2026 CredLock. Built for the Creditcoin BUIDL CTC hackathon.</p>
          <p>Enforced on-chain, not in this interface.</p>
        </div>
      </div>
    </footer>
  )
}
