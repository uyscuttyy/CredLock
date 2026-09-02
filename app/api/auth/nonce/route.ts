import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { walletAddressSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate wallet address
        const validationResult = walletAddressSchema.safeParse(body.walletAddress)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            )
        }

        const walletAddress = validationResult.data

        // Generate a nonce for signature
        const nonce = `CredLock-${Date.now()}-${Math.random().toString(36).substring(7)}`

        // Store wallet if it doesn't exist
        await prisma.wallet.upsert({
            where: { address: walletAddress },
            create: { address: walletAddress },
            update: {},
        })

        return NextResponse.json({
            nonce,
            message: `Sign this message to authenticate with CredLock: ${nonce}`,
        })
    } catch (error) {
        console.error('Failed to generate nonce:', error)
        return NextResponse.json(
            { error: 'Failed to generate nonce', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}