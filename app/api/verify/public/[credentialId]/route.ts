import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '@/lib/services/credentialService'

export async function GET(
    request: NextRequest,
    { params }: { params: { credentialId: string } }
) {
    try {
        const credential = await credentialService.getCredentialById(params.credentialId)

        // Remove sensitive information for public verification
        const publicCredential = {
            id: credential.id,
            type: credential.type,
            claims: credential.claims,
            sourceChains: credential.sourceChains,
            issuedAt: credential.issuedAt,
            expiresAt: credential.expiresAt,
            status: credential.status,
            attestationVerified: credential.attestationVerified,
            verificationTimestamp: credential.verificationTimestamp,
        }

        return NextResponse.json({
            valid: credential.status === 'current',
            credential: publicCredential,
        })
    } catch (error) {
        console.error('Failed to verify public credential:', error)
        return NextResponse.json(
            {
                valid: false,
                error: 'Credential not found or invalid',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 404 }
        )
    }
}