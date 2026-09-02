export interface AttestationRequest {
    walletAddress: string
    credentialType: string
    claims: Record<string, unknown>
    sourceChains: string[]
    timestamp: number
}

export interface AttestationResponse {
    attestationId: string
    attestationHash: string
    proof: AttestationProof
    status: 'pending' | 'confirmed' | 'failed'
    timestamp: number
}

export interface AttestationProof {
    type: string
    created: string
    verificationMethod: string
    proofPurpose: string
    proofValue: string
    jws?: string
    [key: string]: unknown
}

export interface AttestationVerificationResult {
    valid: boolean
    attestationId?: string
    issuer?: string
    timestamp?: number
    reason?: string
}

export interface AttestcoinClient {
    createAttestation(request: AttestationRequest): Promise<AttestationResponse>
    verifyAttestation(attestationHash: string): Promise<AttestationVerificationResult>
    getAttestation(attestationId: string): Promise<AttestationResponse | null>
}