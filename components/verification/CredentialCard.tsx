'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { formatTimestamp, timeAgo } from '@/lib/utils'

interface CredentialCardProps {
    credential: any
    onRefresh?: () => void
}

export const CredentialCard = ({ credential, onRefresh }: CredentialCardProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showCopied, setShowCopied] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch(`/api/credentials/${credential.id}/refresh`, {
                method: 'POST',
            })

            if (response.ok && onRefresh) {
                onRefresh()
            }
        } catch (error) {
            console.error('Failed to refresh credential:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleShare = async () => {
        const shareLink = `${window.location.origin}/verify/${credential.id}`

        try {
            await navigator.clipboard.writeText(shareLink)
            setShowCopied(true)
            setTimeout(() => setShowCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy link:', error)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold capitalize mb-1">
                            {credential.type.replace(/_/g, ' ')}
                        </h3>
                        <StatusBadge status={credential.status} />
                    </div>
                    {credential.attestationRef && (
                        <div className="text-right">
                            <p className="text-xs text-brand-muted">Attestation</p>
                            <p className="text-xs font-mono">{credential.attestationRef.slice(0, 12)}...</p>
                        </div>
                    )}
                </div>

                {/* Claims */}
                <div className="space-y-3 mb-4">
                    {Object.entries(credential.claims).slice(0, 4).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-sm text-brand-muted capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <span className="text-sm font-semibold">
                                {typeof value === 'string' && value.includes('000000000000000000')
                                    ? (Number(value) / 1e18).toFixed(2)
                                    : value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Source chains */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {credential.sourceChains.map((chain: string) => (
                        <span key={chain} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {chain}
                        </span>
                    ))}
                </div>

                {/* Timestamps */}
                <div className="text-xs text-brand-muted mb-4">
                    <p>Issued: {formatTimestamp(credential.issuedAt)}</p>
                    <p>Expires: {formatTimestamp(credential.expiresAt)}</p>
                    {credential.lastCheckedAt && (
                        <p>Last checked: {timeAgo(credential.lastCheckedAt)}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="flex-1"
                    >
                        {showCopied ? 'COPIED ✓' : 'SHARE'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        isLoading={isRefreshing}
                        className="flex-1"
                    >
                        REFRESH
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}