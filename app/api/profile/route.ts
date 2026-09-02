import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activityService } from '@/lib/services/activityService'
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

        // Get wallet info
        const wallet = await prisma.wallet.findUnique({
            where: { address: validationResult.data },
            include: {
                credentials: {
                    orderBy: { issuedAt: 'desc' },
                },
                verifications: {
                    orderBy: { verifiedAt: 'desc' },
                    take: 1,
                },
            },
        })

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            )
        }

        // Get activity counts
        const activityCounts = await activityService.countActivitiesByType(wallet.address)

        // Get recent activities
        const recentActivities = await activityService.getWalletActivities(wallet.address)

        // Get credentials
        const credentials = await credentialService.getWalletCredentials(wallet.address)

        // Calculate statistics
        const statistics = {
            totalActivities: Object.values(activityCounts).reduce((a, b) => a + b, 0),
            repayments: activityCounts['repayment'] || 0,
            borrows: activityCounts['borrow'] || 0,
            liquidations: activityCounts['liquidation'] || 0,
            collateralEvents: activityCounts['collateral_change'] || 0,
            defaults: 0, // No defaults detected
            monthsActive: calculateMonthsActive(recentActivities),
        }

        // Get verification status
        const verificationStatus = wallet.verifications[0]
            ? {
                verified: true,
                verifiedAt: wallet.verifications[0].verifiedAt,
                attestationRef: wallet.verifications[0].attestationRef,
            }
            : {
                verified: false,
                verifiedAt: null,
                attestationRef: null,
            }

        return NextResponse.json({
            walletAddress: wallet.address,
            statistics,
            verificationStatus,
            credentials,
            recentActivities: recentActivities.slice(0, 10), // Last 10 activities
        })
    } catch (error) {
        console.error('Failed to get profile:', error)
        return NextResponse.json(
            { error: 'Failed to get profile', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

function calculateMonthsActive(activities: any[]): number {
    if (activities.length === 0) return 0

    const firstActivity = activities[activities.length - 1]
    const lastActivity = activities[0]

    const firstDate = new Date(firstActivity.blockTimestamp)
    const lastDate = new Date(lastActivity.blockTimestamp)

    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (lastDate.getMonth() - firstDate.getMonth())

    return Math.max(monthsDiff, 1)
}