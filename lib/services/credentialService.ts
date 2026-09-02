import { prisma } from '@/lib/prisma'
import { freshnessService } from '@/lib/services/freshnessService'
import { AttestcoinAdapter } from '@/lib/attestcoin/adapter'

export class CredentialService {
    private attestcoinAdapter = new AttestcoinAdapter()

    /**
     * Get all credentials for a wallet
     */
    async getWalletCredentials(walletAddress: string): Promise<any[]> {
        const credentials = await prisma.credential.findMany({
            where: {
                wallet: { address: walletAddress },
            },
            include: {
                credentialEvents: {
                    orderBy: {
                        occurredAt: 'desc',
                    },
                    take: 5,
                },
            },
            orderBy: {
                issuedAt: 'desc',
            },
        })

        return credentials.map(credential => ({
            id: credential.id,
            type: credential.type,
            claims: credential.claims,
            sourceChains: credential.sourceChains,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
            status: credential.status,
            lastCheckedAt: credential.lastCheckedAt,
            attestationRef: credential.attestationRef,
            recentEvents: credential.credentialEvents.map(event => ({
                type: event.eventType,
                occurredAt: event.occurredAt,
                relevance: event.relevance,
            })),
        }))
    }

    /**
     * Get credential by ID (for public verification)
     */
    async getCredentialById(credentialId: string): Promise<any> {
        const credential = await prisma.credential.findUnique({
            where: { id: credentialId },
            include: {
                wallet: true,
                verification: true,
            },
        })

        if (!credential) {
            throw new Error('Credential not found')
        }

        // Check freshness before returning
        const freshness = await freshnessService.checkCredentialFreshness(credentialId)

        // Verify attestation if exists
        let attestationVerified = false
        if (credential.attestationRef) {
            try {
                const result = await this.attestcoinAdapter.verifyCredentialAttestation(
                    credential.attestationRef
                )
                attestationVerified = result.valid
            } catch (error) {
                console.error('Failed to verify attestation:', error)
            }
        }

        return {
            id: credential.id,
            type: credential.type,
            claims: credential.claims,
            sourceChains: credential.sourceChains,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
            status: freshness.status,
            walletAddress: credential.wallet.address,
            attestationVerified,
            attestationRef: credential.attestationRef,
            verificationTimestamp: credential.verification.verifiedAt,
        }
    }

    /**
     * Refresh credential
     */
    async refreshCredential(credentialId: string): Promise<any> {
        const freshness = await freshnessService.checkCredentialFreshness(credentialId)

        const credential = await prisma.credential.findUnique({
            where: { id: credentialId },
        })

        if (!credential) {
            throw new Error('Credential not found')
        }

        return {
            id: credential.id,
            status: freshness.status,
            relevantEventsFound: freshness.relevantEventsFound,
            lastCheckedAt: freshness.lastCheckedAt,
        }
    }

    /**
     * Create shareable link
     */
    async createShareableLink(credentialId: string): Promise<string> {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return `${baseUrl}/verify/${credentialId}`
    }
}

export const credentialService = new CredentialService()