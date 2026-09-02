import type { AttestcoinClient, AttestationRequest, AttestationResponse, AttestationVerificationResult } from './types'
import { getAttestcoinClient } from './client'
import { prisma } from '@/lib/prisma'

/**
 * Attestcoin Adapter
 * 
 * This adapter provides a clean interface between CredLock and Attestcoin.
 * It handles:
 * 1. Creating verifiable attestations for credentials
 * 2. Verifying attestations
 * 3. Managing attestation lifecycle
 * 
 * The adapter pattern allows us to swap implementations when the Attestcoin
 * SDK becomes available without changing the core CredLock logic.
 */
export class AttestcoinAdapter {
    private client: AttestcoinClient

    constructor(client?: AttestcoinClient) {
        this.client = client || getAttestcoinClient()
    }

    /**
     * Create an attestation for a credential
     */
    async createCredentialAttestation(
        walletAddress: string,
        credentialType: string,
        claims: Record<string, unknown>,
        sourceChains: string[]
    ): Promise<AttestationResponse> {
        const request: AttestationRequest = {
            walletAddress,
            credentialType,
            claims,
            sourceChains,
            timestamp: Date.now(),
        }

        try {
            const response = await this.client.createAttestation(request)
            return response
        } catch (error) {
            console.error('Failed to create Attestcoin attestation:', error)
            throw error
        }
    }

    /**
     * Verify an attestation
     */
    async verifyCredentialAttestation(attestationHash: string): Promise<AttestationVerificationResult> {
        try {
            const result = await this.client.verifyAttestation(attestationHash)
            return result
        } catch (error) {
            console.error('Failed to verify Attestcoin attestation:', error)
            throw error
        }
    }

    /**
     * Check if Attestcoin integration is available
     */
    isAttestcoinAvailable(): boolean {
        return Boolean(
            process.env.ATTESTCOIN_API_URL ||
            process.env.ATTESTCOIN_CONTRACT_ADDRESS
        )
    }

    /**
     * Get integration status
     */
    getIntegrationStatus(): {
        available: boolean
        message: string
    } {
        const available = this.isAttestcoinAvailable()

        return {
            available,
            message: available
                ? 'Attestcoin integration is configured and ready'
                : 'Attestcoin integration pending. SDK integration point is ready. ' +
                'Please configure ATTESTCOIN_API_URL and ATTESTCOIN_CONTRACT_ADDRESS environment variables.',
        }
    }
}