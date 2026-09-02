import { NextRequest, NextResponse } from 'next/server'
import { activityService } from '@/lib/services/activityService'
import { scanWalletSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const validationResult = scanWalletSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error },
                { status: 400 }
            )
        }

        const { walletAddress } = validationResult.data

        // Check if wallet exists
        const wallet = await prisma.wallet.findUnique({
            where: { address: walletAddress },
        })


        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found. Please connect your wallet first.' },
                { status: 404 }
            )
        }

        // Discover activities
        const activities = await activityService.discoverActivities(walletAddress)

        // Persist activities
        await activityService.persistActivities(walletAddress, activities)

        // Get activity counts
        const activityCounts = await activityService.countActivitiesByType(walletAddress)

        return NextResponse.json({
            success: true,
            activitiesFound: activities.length,
            activityCounts,
            activities,
        })
    } catch (error) {
        console.error('Scan failed:', error)
        return NextResponse.json(
            { error: 'Failed to scan wallet', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}