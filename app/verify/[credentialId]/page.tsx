'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatTimestamp } from '@/lib/utils'

export default function PublicVerificationPage({
    params,
}: {
    params: { credentialId: string }
}) {
    const [verificationData, setVerificationData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchVerification()
    }, [params.credentialId])

    const fetchVerification = async () => {
        try {
            const response = await fetch(`/api/verify/public/${params.credentialId}`)
            const data = await response.json()

            if (response.ok) {
                setVerificationData(data)
            } else {
                setError(data.message || 'Credential not found')
            }
        } catch (error) {
            setError('Failed to verify credential')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-brand-muted">Verifying credential...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-3xl font-bold mb-4">Invalid Credential</h1>
                <p className="text-brand-muted">{error}</p>
            </div>
        )
    }

    const { valid, credential } = verificationData

    return (
        <div className="container-custom py-12">
            <div className="max-w-2xl mx-auto">
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{valid ? '✓' : '⚠'}</div>
                        <h1 className="text-3xl font-bold mb-2">
                            {valid ? 'VALID CREDENTIAL' : 'CREDENTIAL ATTENTION REQUIRED'}
                        </h1>
                        <StatusBadge status={credential.status} className="mt-4" />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-brand-muted mb-2">Credential Type</h3>
                            <p className="text-lg font-semibold capitalize">
                                {credential.type.replace(/_/g, ' ')}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-brand-muted mb-2">Verified Claims</h3>
                            <div className="space-y-2">
                                {Object.entries(credential.claims).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="text-sm text-brand-muted capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {typeof value === 'string' && value.includes('000000000000000000')
                                                ? (Number(value) / 1e18).toFixed(4)
                                                : value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-brand-muted mb-2">Source Chains</h3>
                            <div className="flex flex-wrap gap-2">
                                {credential.sourceChains.map((chain: string) => (
                                    <span key={chain} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                        {chain}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-brand-muted mb-2">Issued Date</h3>
                            <p className="text-sm">{formatTimestamp(credential.issuedAt)}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-brand-muted mb-2">Attestcoin Verification</h3>
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm font-semibold ${credential.attestationVerified ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                    {credential.attestationVerified ? '✓ Verified' : '⚠ Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <p className="text-xs text-brand-muted text-center">
                                This credential was verified through CredLock and Attestcoin.
                                The status is automatically updated based on the latest on-chain activity.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}