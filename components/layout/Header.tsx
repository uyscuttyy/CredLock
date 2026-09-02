'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'

export const Header = () => {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/verify', label: 'Verify' },
    { href: '/profile', label: 'Profile' },
    { href: '/credentials', label: 'Credentials' },
  ]
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl">CredLock</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-brand-accent'
                    : 'text-brand-muted hover:text-brand-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="hidden sm:block">
                <span className="text-xs text-brand-muted">Connected:</span>
                <p className="text-sm font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            ) : null}
            <ConnectWallet />
          </div>
        </div>
        
        {/* Mobile navigation */}
        <nav className="md:hidden mt-4 flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}