import { NextRequest, NextResponse } from 'next/server'
import { verificationService } from '@/lib/services/verificationService'
import { verifyWalletSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const validationResult = verifyWalletSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error },
                { status: 400 }
            )
        }

        const { walletAddress, credentialTypes } = validationResult.data

        // Verify wallet exists
        const wallet = await prisma.wallet.findUnique({
            where: { address: walletAddress },
        })

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found. Please connect your wallet first.' },
                { status: 404 }
            )
        }

        // Perform verification
        const result = await verificationService.verifyWallet(
            walletAddress,
            credentialTypes
        )

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Verification failed:', error)
        return NextResponse.json(
            { error: 'Verification failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}