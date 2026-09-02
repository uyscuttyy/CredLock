'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { CredentialCard } from '@/components/verification/CredentialCard'

export default function CredentialsPage() {
    const { address, isConnected } = useAccount()
    const [credentials, setCredentials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (address) {
            fetchCredentials(address)
        }
    }, [address])

    const fetchCredentials = async (walletAddress: string) => {
        try {
            const response = await fetch(`/api/credentials?wallet=${walletAddress}`)
            const data = await response.json()
            setCredentials(data.credentials)
        } catch (error) {
            console.error('Failed to fetch credentials:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isConnected) {
        return (
            <div className="container-custom py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
                <p className="text-brand-muted">Connect your wallet to view your credentials.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
        )
    }

    return (
        <div className="container-custom py-12">
            <h1 className="text-4xl font-bold mb-2">Your verified credentials.</h1>
            <p className="text-xl text-brand-muted mb-8">
                Verifiable proof of your financial history, ready to use with supported applications.
            </p>

            {credentials.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📜</div>
                    <h2 className="text-2xl font-bold mb-4">No Credentials Yet</h2>
                    <p className="text-brand-muted mb-8">
                        Complete wallet verification to create your first credential.
                    </p>
                    <a href="/verify" className="inline-flex px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary/90">
                        VERIFY WALLET
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {credentials.map((credential) => (
                        <CredentialCard
                            key={credential.id}
                            credential={credential}
                            onRefresh={() => fetchCredentials(address!)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}