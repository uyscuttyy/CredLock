'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAddress, formatTimestamp, timeAgo } from '@/lib/utils'

export default function ProfilePage() {
    const { address, isConnected } = useAccount()
    const [profileData, setProfileData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (address) {
            fetchProfile(address)
        }
    }, [address])

    const fetchProfile = async (walletAddress: string) => {
        try {
            const response = await fetch(`/api/profile?wallet=${walletAddress}`)
            const data = await response.json()
            setProfileData(data)
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isConnected) {
        return (
            <div className="container-custom py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
                <p className="text-brand-muted">Connect your wallet to view your financial reputation.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-brand-muted">Loading your profile...</p>
            </div>
        )
    }

    if (!profileData) {
        return (
            <div className="container-custom py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">No Profile Found</h1>
                <p className="text-brand-muted mb-8">
                    Complete wallet verification to create your financial reputation profile.
                </p>
                <a href="/verify" className="inline-flex px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary/90">
                    VERIFY WALLET
                </a>
            </div>
        )
    }

    return (
        <div className="container-custom py-12">
            <h1 className="text-4xl font-bold mb-2">Your financial reputation.</h1>
            <p className="text-xl text-brand-muted mb-8">
                Verified across {profileData.credentials.length} credential types
            </p>

            {/* Wallet Info */}
            <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-brand-muted">Wallet Address</p>
                        <p className="font-mono text-lg">{formatAddress(profileData.walletAddress)}</p>
                    </div>
                    <StatusBadge status={profileData.verificationStatus.verified ? 'verified' : 'pending'} />
                </div>
                {profileData.verificationStatus.verified && (
                    <div className="text-sm text-brand-muted">
                        <p>Last verified: {formatTimestamp(profileData.verificationStatus.verifiedAt)}</p>
                        <p>No relevant activity detected since verification.</p>
                        <p>Next full verification: {formatTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000))}</p>
                    </div>
                )}
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'REPAYMENTS', value: profileData.statistics.repayments },
                    { label: 'DEFAULTS', value: profileData.statistics.defaults },
                    { label: 'LIQUIDATIONS', value: profileData.statistics.liquidations },
                    { label: 'MONTHS HISTORY', value: profileData.statistics.monthsActive },
                ].map((stat, index) => (
                    <Card key={index} className="p-6 text-center">
                        <div className="text-3xl font-bold text-brand-accent mb-2">{stat.value}</div>
                        <div className="text-xs font-semibold text-brand-muted">{stat.label}</div>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <h2 className="text-2xl font-bold mb-6">Recent Verified Activity</h2>
            <div className="space-y-4">
                {profileData.recentActivities.map((activity: any, index: number) => (
                    <Card key={index} className="p-4" hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold capitalize">{activity.activityType}</p>
                                <p className="text-sm text-brand-muted">
                                    {activity.chain} • {activity.protocol || 'Unknown Protocol'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-brand-muted">{timeAgo(activity.blockTimestamp)}</p>
                                <a
                                    href={`https://etherscan.io/tx/${activity.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-accent hover:underline"
                                >
                                    View Transaction
                                </a>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}