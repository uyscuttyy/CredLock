'use client'

import Link from 'next/link'

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200/50">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="font-bold text-xl">CredLock</span>
                        </div>
                        <p className="text-brand-muted text-sm leading-relaxed">
                            Your financial history, verified across chains. CredLock turns your on-chain activity
                            into verifiable financial credentials you can carry across ecosystems.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li><Link href="/verify" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Verify Wallet</Link></li>
                            <li><Link href="/profile" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Your Profile</Link></li>
                            <li><Link href="/credentials" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Credentials</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Technology</h3>
                        <ul className="space-y-2">
                            <li><a href="https://creditcoin.org" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Creditcoin</a></li>
                            <li><a href="https://attestcoin.org" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Attestcoin</a></li>
                            <li><a href="https://aave.com" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Aave Protocol</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-xs text-brand-muted">
                        © 2026 CredLock. Built for Creditcoin BUIDL CTC 2026 Fall Hackathon.
                    </p>
                    <p className="text-xs text-brand-muted mt-2 md:mt-0">
                        Powered by Attestcoin
                    </p>
                </div>
            </div>
        </footer>
    )
}