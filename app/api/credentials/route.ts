import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '@/lib/services/credentialService'
import { walletAddressSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
    try {
        const walletAddress = request.nextUrl.searchParams.get('wallet')

        // Validate wallet address
        const validationResult = walletAddressSchema.safeParse(walletAddress)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            )
        }

        const credentials = await credentialService.getWalletCredentials(
            validationResult.data
        )

        return NextResponse.json({
            credentials,
        })
    } catch (error) {
        console.error('Failed to get credentials:', error)
        return NextResponse.json(
            { error: 'Failed to get credentials', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}