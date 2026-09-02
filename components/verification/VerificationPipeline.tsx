'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface VerificationPipelineProps {
    walletAddress: string
    credentialTypes: string[]
    onComplete: () => void
}

interface VerificationStage {
    label: string
    status: 'pending' | 'processing' | 'complete' | 'error'
}

export const VerificationPipeline = ({
    walletAddress,
    credentialTypes,
    onComplete,
}: VerificationPipelineProps) => {
    const [isVerifying, setIsVerifying] = useState(false)
    const [stages, setStages] = useState<VerificationStage[]>([
        { label: 'Finding source activity', status: 'pending' },
        { label: 'Preparing attestation', status: 'pending' },
        { label: 'Verifying proof', status: 'pending' },
        { label: 'Recording verified result', status: 'pending' },
    ])
    const [error, setError] = useState<string | null>(null)

    const startVerification = async () => {
        setIsVerifying(true)
        setError(null)

        try {
            // Reset stages
            setStages(prev => prev.map(stage => ({ ...stage, status: 'pending' })))

            // Process verification stages
            for (let i = 0; i < stages.length; i++) {
                setStages(prev =>
                    prev.map((stage, index) =>
                        index === i ? { ...stage, status: 'processing' } : stage
                    )
                )

                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 1500))

                setStages(prev =>
                    prev.map((stage, index) =>
                        index === i ? { ...stage, status: 'complete' } : stage
                    )
                )
            }

            // Call API to verify wallet
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    credentialTypes,
                }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                onComplete()
            } else {
                setError(data.message || 'Verification failed')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Verification failed')
            setStages(prev =>
                prev.map(stage =>
                    stage.status === 'processing' ? { ...stage, status: 'error' } : stage
                )
            )
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-card p-8">
            <h3 className="text-xl font-bold mb-6">ATTESTCOIN VERIFICATION</h3>

            <div className="space-y-4 mb-6">
                {stages.map((stage, index) => (
                    <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${stage.status === 'complete' ? 'bg-green-500' :
                                    stage.status === 'processing' ? 'bg-brand-accent animate-pulse' :
                                        stage.status === 'error' ? 'bg-red-500' :
                                            'bg-gray-300'
                                }`} />
                            <span className="text-sm">{stage.label}</span>
                        </div>
                        <span className="text-xs">
                            {stage.status === 'complete' ? '✓' :
                                stage.status === 'processing' ? 'Processing...' :
                                    stage.status === 'error' ? '✗' :
                                        ''}
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
                onClick={startVerification}
                disabled={isVerifying}
                isLoading={isVerifying}
                className="w-full"
            >
                {isVerifying ? 'VERIFYING...' : 'START VERIFICATION'}
            </Button>
        </div>
    )
}