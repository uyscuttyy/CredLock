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

  const navItems = [
    { href: '/gate', label: 'Gate' },
    { href: '/verify', label: 'Verify' },
    { href: '/credentials', label: 'Credentials' },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-brand-hairline bg-brand-background/95 backdrop-blur">
      <div className="container-custom flex items-center justify-between py-3">
        <Link href="/" aria-label="CredLock home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? 'font-semibold text-brand-primary underline underline-offset-8 decoration-brand-accent decoration-2'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {mounted && isConnected ? (
            <span className="hidden font-mono text-xs text-brand-muted sm:block">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
          ) : null}
          <ConnectWallet />
        </div>
      </div>

      <nav className="flex justify-around border-t border-brand-hairline py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm ${pathname === item.href ? 'font-semibold text-brand-primary' : 'text-brand-muted'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
