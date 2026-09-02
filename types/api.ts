import type { CredentialType, CredentialStatus } from './credentials'

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface ScanResponse {
    activitiesFound: number
    activityCounts: Record<string, number>
    activities: Array<{
        chainId: number
        chainName: string
        txHash: string
        blockNumber: string
        blockTimestamp: number
        activityType: string
        amount?: string
        asset?: string
    }>
}

export interface VerificationResponse {
    success: boolean
    activitiesFound: number
    credentialsCreated: number
    attestationResults: Array<{
        credentialType: string
        attestationHash?: string
        status: 'success' | 'pending' | 'failed'
    }>
    error?: string
}

export interface ProfileResponse {
    walletAddress: string
    statistics: {
        totalActivities: number
        repayments: number
        borrows: number
        liquidations: number
        collateralEvents: number
        defaults: number
        monthsActive: number
    }
    verificationStatus: {
        verified: boolean
        verifiedAt: Date | null
        attestationRef: string | null
    }
    credentials: Array<{
        id: string
        type: CredentialType
        claims: Record<string, unknown>
        sourceChains: string[]
        issuedAt: Date
        expiresAt: Date
        status: CredentialStatus
        lastCheckedAt: Date | null
        attestationRef: string | null
    }>
    recentActivities: Array<{
        id: string
        activityType: string
        txHash: string
        blockNumber: string
        blockTimestamp: Date
        amount: string | null
        asset: string | null
        chain: string
        protocol: string | null
    }>
}