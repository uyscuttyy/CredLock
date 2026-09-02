import { z } from 'zod'

// Wallet address validation
export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')

// Chain ID validation
export const chainIdSchema = z.number().int().positive()

// Credential type validation
export const credentialTypeSchema = z.enum([
    'repayment_history',
    'borrowing_history',
    'collateral_history',
    'asset_ownership',
])

// API input schemas
export const scanWalletSchema = z.object({
    walletAddress: walletAddressSchema,
    chainIds: z.array(chainIdSchema).optional(),
})

export const verifyWalletSchema = z.object({
    walletAddress: walletAddressSchema,
    credentialTypes: z.array(credentialTypeSchema).min(1),
})

export const refreshCredentialSchema = z.object({
    credentialId: z.string().cuid(),
})

export const createCredentialSchema = z.object({
    walletAddress: walletAddressSchema,
    type: credentialTypeSchema,
    claims: z.record(z.unknown()),
    sourceChains: z.array(z.string()),
    attestationRef: z.string().optional(),
})

// Blockchain event schemas
export const blockchainEventSchema = z.object({
    chainId: z.number(),
    txHash: z.string(),
    blockNumber: z.bigint(),
    blockTimestamp: z.number(),
    protocol: z.string().optional(),
    activityType: z.string(),
    amount: z.bigint().optional(),
    asset: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
})

export type ScanWalletInput = z.infer<typeof scanWalletSchema>
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>
export type RefreshCredentialInput = z.infer<typeof refreshCredentialSchema>
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>
export type BlockchainEvent = z.infer<typeof blockchainEventSchema>