'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface ScanPipelineProps {
    walletAddress: string
    onComplete: (data: any) => void
}

interface ScanStage {
    label: string
    status: 'pending' | 'scanning' | 'complete' | 'error'
    chainId?: number
}

export const ScanPipeline = ({ walletAddress, onComplete }: ScanPipelineProps) => {
    const [isScanning, setIsScanning] = useState(false)
    const [stages, setStages] = useState<ScanStage[]>([
        { label: 'Ethereum', status: 'pending', chainId: 1 },
        { label: 'Base', status: 'pending', chainId: 8453 },
        { label: 'Arbitrum', status: 'pending', chainId: 42161 },
    ])
    const [error, setError] = useState<string | null>(null)

    const startScan = async () => {
        setIsScanning(true)
        setError(null)

        try {
            // Reset stages
            setStages(prev => prev.map(stage => ({ ...stage, status: 'pending' })))

            // Scan each chain
            for (let i = 0; i < stages.length; i++) {
                setStages(prev =>
                    prev.map((stage, index) =>
                        index === i ? { ...stage, status: 'scanning' } : stage
                    )
                )

                // Simulate scanning delay for visual feedback
                await new Promise(resolve => setTimeout(resolve, 1000))

                setStages(prev =>
                    prev.map((stage, index) =>
                        index === i ? { ...stage, status: 'complete' } : stage
                    )
                )
            }

            // Call API to scan wallet
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            })

            const data = await response.json()

            if (response.ok) {
                onComplete(data)
            } else {
                setError(data.message || 'Failed to scan wallet')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Scan failed')
            setStages(prev =>
                prev.map(stage =>
                    stage.status === 'scanning' ? { ...stage, status: 'error' } : stage
                )
            )
        } finally {
            setIsScanning(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-card p-8">
            <h3 className="text-xl font-bold mb-2">SCANNING WALLET</h3>
            <p className="text-brand-muted mb-6">
                Finding verifiable financial activity across supported chains...
            </p>

            {/* Chain status */}
            <div className="space-y-4 mb-6">
                {stages.map((stage, index) => (
                    <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${stage.status === 'complete' ? 'bg-green-500' :
                                    stage.status === 'scanning' ? 'bg-brand-accent animate-pulse' :
                                        stage.status === 'error' ? 'bg-red-500' :
                                            'bg-gray-300'
                                }`} />
                            <span className="font-medium">{stage.label}</span>
                        </div>
                        <span className="text-sm text-brand-muted">
                            {stage.status === 'complete' ? '✓' :
                                stage.status === 'scanning' ? 'Scanning...' :
                                    stage.status === 'error' ? '✗' :
                                        '○'}
                        </span>
                    </motion.div>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <Button
                onClick={startScan}
                disabled={isScanning}
                isLoading={isScanning}
                className="w-full"
            >
                {isScanning ? 'SCANNING...' : 'SCAN WALLET'}
            </Button>
        </div>
    )
}