import { prisma } from '@/lib/prisma'
import { activityService } from '@/lib/services/activityService'
import { AttestcoinAdapter } from '@/lib/attestcoin/adapter'
import type { BlockchainActivity } from '@/types/blockchain'

export interface VerificationResult {
  success: boolean
  activitiesFound: number
  credentialsCreated: number
  attestationResults: Array<{
    credentialType: string
    attestationHash?: string
    status: 'success' | 'pending' | 'failed'
  }>
  error?: string
}

export class VerificationService {
  private attestcoinAdapter = new AttestcoinAdapter()

  async verifyWallet(
    walletAddress: string,
    credentialTypes: string[]
  ): Promise<VerificationResult> {
    try {
      const activities = await activityService.discoverActivities(walletAddress)

      if (activities.length === 0) {
        return {
          success: false,
          activitiesFound: 0,
          credentialsCreated: 0,
          attestationResults: [],
          error: 'No financial activity found for this wallet',
        }
      }

      await activityService.persistActivities(walletAddress, activities)

      const checkpoint = await this.createCheckpoint(walletAddress)

      const credentials = await this.createCredentials(
        walletAddress,
        credentialTypes,
        activities
      )

      const attestationResults = await this.createAttestations(
        walletAddress,
        credentialTypes,
        credentials
      )

      return {
        success: true,
        activitiesFound: activities.length,
        credentialsCreated: credentials.length,
        attestationResults,
      }
    } catch (error) {
      console.error('Verification failed:', error)
      return {
        success: false,
        activitiesFound: 0,
        credentialsCreated: 0,
        attestationResults: [],
        error: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  }

  private async createCheckpoint(walletAddress: string): Promise<any> {
    const { EthereumAdapter } = await import('@/lib/blockchain/adapters/EthereumAdapter')
    const ethereumAdapter = new EthereumAdapter()
    const currentBlock = await ethereumAdapter.getCurrentBlock()

    const checkpoint = {
      chainId: 1,
      blockNumber: currentBlock.toString(),
      timestamp: Math.floor(Date.now() / 1000),
    }

    await prisma.verification.create({
      data: {
        wallet: {
          connect: { address: walletAddress },
        },
        checkpoint: JSON.parse(JSON.stringify(checkpoint)),
        status: 'verified',
        verifiedAt: new Date(),
      },
    })

    return checkpoint
  }

  private async createCredentials(
    walletAddress: string,
    credentialTypes: string[],
    activities: BlockchainActivity[]
  ): Promise<any[]> {
    const credentials: any[] = []

    const verification = await prisma.verification.findFirst({
      where: {
        wallet: { address: walletAddress },
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    })

    if (!verification) {
      throw new Error('No verification found')
    }

    for (const type of credentialTypes) {
      const relevantActivities = this.filterRelevantActivities(type, activities)

      if (relevantActivities.length === 0) continue

      const claims = this.createClaims(type, relevantActivities)

      const credential = await prisma.credential.create({
        data: {
          wallet: {
            connect: { address: walletAddress },
          },
          verification: {
            connect: { id: verification.id },
          },
          type,
          claims: JSON.parse(JSON.stringify(claims)),
          sourceChains: [...new Set(relevantActivities.map(a => a.chainName))],
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'current',
          lastCheckedAt: new Date(),
        },
      })

      credentials.push(credential)
    }

    return credentials
  }

  private filterRelevantActivities(
    credentialType: string,
    activities: BlockchainActivity[]
  ): BlockchainActivity[] {
    switch (credentialType) {
      case 'repayment_history':
        return activities.filter(a =>
          a.activityType === 'repayment' || a.activityType === 'borrow'
        )
      case 'borrowing_history':
        return activities.filter(a =>
          a.activityType === 'borrow' || a.activityType === 'repayment'
        )
      case 'collateral_history':
        return activities.filter(a =>
          a.activityType === 'collateral_change' || a.activityType === 'liquidation'
        )
      case 'asset_ownership':
        return activities.filter(a => a.activityType === 'collateral_change')
      default:
        return []
    }
  }

  private createClaims(
    credentialType: string,
    activities: BlockchainActivity[]
  ): Record<string, unknown> {
    const claims: Record<string, unknown> = {
      totalActivities: activities.length,
      chains: [...new Set(activities.map(a => a.chainName))],
      firstActivity: activities[activities.length - 1]?.blockTimestamp,
      lastActivity: activities[0]?.blockTimestamp,
    }

    switch (credentialType) {
      case 'repayment_history':
        const repayments = activities.filter(a => a.activityType === 'repayment')
        claims.repaymentCount = repayments.length
        claims.totalRepaid = repayments.reduce((sum, a) => sum + (a.amount || 0n), 0n).toString()
        claims.hasDefaulted = activities.some(a => a.activityType === 'liquidation')
        break
      case 'borrowing_history':
        const borrows = activities.filter(a => a.activityType === 'borrow')
        claims.borrowCount = borrows.length
        claims.totalBorrowed = borrows.reduce((sum, a) => sum + (a.amount || 0n), 0n).toString()
        break
      case 'collateral_history':
        const collateralEvents = activities.filter(a => a.activityType === 'collateral_change')
        claims.collateralEventCount = collateralEvents.length
        claims.hasBeenLiquidated = activities.some(a => a.activityType === 'liquidation')
        break
      case 'asset_ownership':
        claims.assetCount = activities.length
        break
    }

    return claims
  }

  private async createAttestations(
    walletAddress: string,
    credentialTypes: string[],
    credentials: any[]
  ): Promise<Array<{
    credentialType: string
    attestationHash?: string
    status: 'success' | 'pending' | 'failed'
  }>> {
    const results: Array<{
      credentialType: string
      attestationHash?: string
      status: 'success' | 'pending' | 'failed'
    }> = []

    const attestcoinStatus = this.attestcoinAdapter.getIntegrationStatus()

    if (!attestcoinStatus.available) {
      credentialTypes.forEach(type => {
        results.push({
          credentialType: type,
          status: 'pending',
        })
      })
      return results
    }

    for (const credential of credentials) {
      try {
        const attestation = await this.attestcoinAdapter.createCredentialAttestation(
          walletAddress,
          credential.type,
          credential.claims,
          credential.sourceChains
        )

        await prisma.credential.update({
          where: { id: credential.id },
          data: {
            attestationRef: attestation.attestationHash,
            attestationProof: JSON.parse(JSON.stringify(attestation.proof)),
          },
        })

        results.push({
          credentialType: credential.type,
          attestationHash: attestation.attestationHash,
          status: 'success',
        })
      } catch (error) {
        console.error(`Failed to create attestation for ${credential.type}:`, error)
        results.push({
          credentialType: credential.type,
          status: 'failed',
        })
      }
    }

    return results
  }
}

export const verificationService = new VerificationService()