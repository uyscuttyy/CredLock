export type CredentialType =
    | 'repayment_history'
    | 'borrowing_history'
    | 'collateral_history'
    | 'asset_ownership'

export type CredentialStatus = 'current' | 'stale' | 'expired'

export interface CredentialClaims {
    totalActivities?: number
    chains?: string[]
    firstActivity?: number
    lastActivity?: number
    repaymentCount?: number
    totalRepaid?: string
    hasDefaulted?: boolean
    borrowCount?: number
    totalBorrowed?: string
    collateralEventCount?: number
    hasBeenLiquidated?: boolean
    assetCount?: number
    [key: string]: unknown
}

export interface Credential {
    id: string
    walletAddress: string
    type: CredentialType
    claims: CredentialClaims
    sourceChains: string[]
    issuedAt: Date
    expiresAt: Date
    status: CredentialStatus
    lastCheckedAt?: Date
    attestationRef?: string
    attestationProof?: Record<string, unknown>
}

export interface CredentialWithEvents extends Credential {
    recentEvents: Array<{
        type: string
        occurredAt: Date
        relevance: string
    }>
}