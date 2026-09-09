'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { Logo } from '@/components/layout/Logo'

export const Header = () => {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const navItems = [{ href: '/gate', label: 'Gate console' }]

  return (
    <header className="carbon sticky top-0 z-50 border-b border-white/10">
      <div className="container-custom flex items-center justify-between py-3">
        <Link href="/" aria-label="CredLock home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-sans text-sm transition-colors ${
                pathname === item.href
                  ? 'font-semibold text-bullion'
                  : 'text-ash hover:text-bone'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {mounted && isConnected ? (
            <span className="hidden items-center gap-2 font-mono text-xs text-ash sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-allow" aria-hidden />
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
          ) : null}
          <ConnectWallet />
        </div>
      </div>

      <nav className="flex justify-around border-t border-white/10 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`font-sans text-sm ${pathname === item.href ? 'font-semibold text-bullion' : 'text-ash'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
