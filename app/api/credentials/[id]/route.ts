import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '@/lib/services/credentialService'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const credential = await credentialService.getCredentialById(params.id)

        return NextResponse.json({
            credential,
        })
    } catch (error) {
        console.error('Failed to get credential:', error)
        return NextResponse.json(
            { error: 'Credential not found', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 404 }
        )
    }
}