import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '@/lib/services/credentialService'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const result = await credentialService.refreshCredential(params.id)

        return NextResponse.json({
            success: true,
            ...result,
        })
    } catch (error) {
        console.error('Failed to refresh credential:', error)
        return NextResponse.json(
            { error: 'Failed to refresh credential', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}