'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 md:py-32">
                {/* Background waves */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <svg className="absolute w-full h-full" viewBox="0 0 1440 800" fill="none">
                            <path d="M0 400 Q 360 300 720 400 T 1440 400" stroke="#2563EB" strokeWidth="1" fill="none" />
                            <path d="M0 450 Q 360 350 720 450 T 1440 450" stroke="#1D4ED8" strokeWidth="0.5" fill="none" />
                            <path d="M0 350 Q 360 250 720 350 T 1440 350" stroke="#2563EB" strokeWidth="0.5" fill="none" />
                        </svg>
                    </div>
                </div>

                <div className="container-custom relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left column - Text */}
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                            >
                                Your financial history,{' '}
                                <span className="gradient-text">verified across chains.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xl text-brand-muted mb-8 leading-relaxed"
                            >
                                CredLock turns your on-chain activity into verifiable financial
                                credentials you can carry across ecosystems.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <Link href="/verify">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        VERIFY YOUR WALLET
                                    </Button>
                                </Link>
                                <a href="#how-it-works">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        LEARN HOW IT WORKS
                                    </Button>
                                </a>
                            </motion.div>
                        </div>

                        {/* Right column - Floating cards */}
                        <div className="relative h-[500px] hidden lg:block">
                            {/* Source chains card */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="absolute top-0 left-0 w-64 animate-float"
                            >
                                <div className="bg-white rounded-2xl shadow-card p-6">
                                    <h3 className="text-sm font-semibold text-brand-muted mb-4">SOURCE CHAINS</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm">Ethereum</span>
                                            <span className="ml-auto text-xs text-green-600">✓</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm">Base</span>
                                            <span className="ml-auto text-xs text-green-600">✓</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span className="text-sm">Arbitrum</span>
                                            <span className="ml-auto text-xs text-green-600">✓</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Verification card */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="absolute top-40 right-0 w-64 animate-float-delayed"
                            >
                                <div className="bg-white rounded-2xl shadow-card p-6">
                                    <h3 className="text-sm font-semibold text-brand-muted mb-4">VERIFICATION</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 bg-brand-accent rounded-full"></div>
                                            <span className="text-xs">Scanning activity...</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 bg-brand-accent rounded-full"></div>
                                            <span className="text-xs">Verifying records...</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                            <span className="text-xs">Verified ✓</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CredLock card */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                                className="absolute bottom-20 left-20 w-56"
                            >
                                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-glow p-6 text-white">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                                            <span className="text-brand-primary font-bold text-xs">C</span>
                                        </div>
                                        <span className="font-bold">CredLock</span>
                                    </div>
                                    <p className="text-sm opacity-90">Portable Financial Reputation</p>
                                </div>
                            </motion.div>

                            {/* Verified credential card */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.9 }}
                                className="absolute bottom-0 right-10 w-72"
                            >
                                <div className="bg-white rounded-2xl shadow-card-hover p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold">VERIFIED CREDENTIAL</h3>
                                        <span className="text-xs text-green-600">✓ VALID</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-brand-muted">Repayments</span>
                                            <span className="text-sm font-semibold">12</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-brand-muted">Defaults</span>
                                            <span className="text-sm font-semibold">0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-brand-muted">History</span>
                                            <span className="text-sm font-semibold">18 months</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works section */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="container-custom">
                    <h2 className="text-4xl font-bold text-center mb-12">How CredLock Works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Connect & Scan',
                                description: 'Connect your wallet and let CredLock scan your activity across Ethereum, Base, and Arbitrum.',
                                icon: '🔍',
                            },
                            {
                                title: 'Verify History',
                                description: 'CredLock discovers your financial activities and prepares them for verification through Attestcoin.',
                                icon: '✓',
                            },
                            {
                                title: 'Get Credentials',
                                description: 'Receive portable credentials that prove your financial history, ready to use across ecosystems.',
                                icon: '📜',
                            },
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="text-center"
                            >
                                <div className="text-6xl mb-4">{step.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                <p className="text-brand-muted leading-relaxed">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-brand-primary to-brand-secondary">
                <div className="container-custom text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to prove your financial history?
                    </h2>
                    <p className="text-xl text-white/80 mb-8">
                        Start verifying your on-chain activity today.
                    </p>
                    <Link href="/verify">
                        <Button size="lg" className="bg-white text-brand-primary hover:bg-gray-100">
                            GET STARTED
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}