'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScanPipeline } from '@/components/verification/ScanPipeline'
import { VerificationPipeline } from '@/components/verification/VerificationPipeline'

export default function VerifyPage() {
    const { address, isConnected } = useAccount()
    const [scanComplete, setScanComplete] = useState(false)
    const [scanData, setScanData] = useState<any>(null)
    const [selectedCredentials, setSelectedCredentials] = useState<string[]>([])
    const [verificationComplete, setVerificationComplete] = useState(false)

    const handleScanComplete = (data: any) => {
        setScanData(data)
        setScanComplete(true)
    }

    const handleCredentialToggle = (type: string) => {
        setSelectedCredentials(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const handleVerificationComplete = () => {
        setVerificationComplete(true)
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-12 text-center">
                    <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
                    <p className="text-brand-muted mb-8">
                        Connect your wallet to start verifying your financial history.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="container-custom py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">VERIFY YOUR HISTORY</h1>
                <p className="text-xl text-brand-muted mb-8">
                    Let's find what your wallet can prove.
                </p>

                {/* Connected wallet display */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow-card">
                    <p className="text-sm text-brand-muted">Connected Wallet</p>
                    <p className="font-mono text-lg">
                        {address?.slice(0, 10)}...{address?.slice(-8)}
                    </p>
                </div>

                {/* Scan Pipeline */}
                {!scanComplete && (
                    <ScanPipeline
                        walletAddress={address!}
                        onComplete={handleScanComplete}
                    />
                )}

                {/* Credential Selection */}
                {scanComplete && !verificationComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-2xl font-bold mb-4">Select Credentials to Verify</h2>
                        <p className="text-brand-muted mb-6">
                            Choose which credentials you want to create based on your activity.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {[
                                { type: 'repayment_history', label: 'Repayer History', available: scanData?.activityCounts?.repayment > 0 },
                                { type: 'borrowing_history', label: 'Borrowing History', available: scanData?.activityCounts?.borrow > 0 },
                                { type: 'collateral_history', label: 'Collateral History', available: scanData?.activityCounts?.collateral_change > 0 },
                                { type: 'asset_ownership', label: 'Asset Ownership', available: scanData?.activityCounts?.collateral_change > 0 },
                            ].filter(cred => cred.available).map(cred => (
                                <button
                                    key={cred.type}
                                    onClick={() => handleCredentialToggle(cred.type)}
                                    className={`p-6 rounded-lg border-2 transition-all ${selectedCredentials.includes(cred.type)
                                            ? 'border-brand-accent bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{cred.label}</span>
                                        {selectedCredentials.includes(cred.type) && (
                                            <span className="text-brand-accent">✓</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedCredentials.length > 0 && (
                            <VerificationPipeline
                                walletAddress={address!}
                                credentialTypes={selectedCredentials}
                                onComplete={handleVerificationComplete}
                            />
                        )}
                    </motion.div>
                )}

                {/* Verification Complete */}
                {verificationComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-3xl font-bold mb-4">Your history has been verified!</h2>
                        <p className="text-brand-muted mb-8">
                            Your credentials have been created and are ready to use.
                        </p>
                        <Button onClick={() => window.location.href = '/credentials'}>
                            VIEW YOUR CREDENTIALS
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}