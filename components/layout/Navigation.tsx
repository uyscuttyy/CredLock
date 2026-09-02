'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navigation = () => {
    const pathname = usePathname()

    const items = [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/verify', label: 'Verify', icon: '✓' },
        { href: '/profile', label: 'Profile', icon: '👤' },
        { href: '/credentials', label: 'Credentials', icon: '📜' },
    ]

    return (
        <nav className="bg-white border-b border-gray-200/50">
            <div className="container-custom">
                <div className="flex space-x-8">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${pathname === item.href
                                    ? 'border-brand-accent text-brand-primary'
                                    : 'border-transparent text-brand-muted hover:text-brand-primary hover:border-gray-300'
                                }`}
                        >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}