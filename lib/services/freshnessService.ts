import { prisma } from '@/lib/prisma'
import { activityService } from '@/lib/services/activityService'

export interface FreshnessResult {
  status: 'current' | 'stale' | 'expired'
  relevantEventsFound: number
  lastCheckedAt: Date
  nextCheckAt: Date
}

export class FreshnessService {
  async checkCredentialFreshness(credentialId: string): Promise<FreshnessResult> {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: {
        wallet: true,
        verification: true,
      },
    })
    
    if (!credential) {
      throw new Error('Credential not found')
    }
    
    const now = new Date()
    
    if (credential.expiresAt < now) {
      await prisma.credential.update({
        where: { id: credentialId },
        data: {
          status: 'expired',
          lastCheckedAt: now,
        },
      })
      
      return {
        status: 'expired',
        relevantEventsFound: 0,
        lastCheckedAt: now,
        nextCheckAt: now,
      }
    }
    
    const checkpointData = credential.verification.checkpoint as any
    const checkpoint = {
      chainId: Number(checkpointData.chainId),
      blockNumber: BigInt(checkpointData.blockNumber),
      timestamp: Number(checkpointData.timestamp),
    }
    
    const relevantEvents = await activityService.getRelevantEventsForCredential(
      credential.wallet.address,
      credential.type,
      checkpoint
    )
    
    let status: 'current' | 'stale' = 'current'
    
    if (relevantEvents.length > 0) {
      status = 'stale'
      
      for (const event of relevantEvents) {
        const activity = await prisma.activity.findFirst({
          where: {
            txHash: event.txHash,
            activityType: event.activityType,
          },
        })
        
        if (activity) {
          await prisma.credentialEvent.create({
            data: {
              credentialId: credential.id,
              activityId: activity.id,
              relevance: 'relevant',
              eventType: event.activityType,
              occurredAt: new Date(event.blockTimestamp * 1000),
            },
          })
        }
      }
    }
    
    await prisma.credential.update({
      where: { id: credentialId },
      data: {
        status,
        lastCheckedAt: now,
      },
    })
    
    return {
      status,
      relevantEventsFound: relevantEvents.length,
      lastCheckedAt: now,
      nextCheckAt: new Date(now.getTime() + 5 * 60 * 1000),
    }
  }
  
  async refreshWalletCredentials(walletAddress: string): Promise<FreshnessResult[]> {
    const credentials = await prisma.credential.findMany({
      where: {
        wallet: { address: walletAddress },
        status: { in: ['current', 'stale'] },
      },
    })
    
    const results: FreshnessResult[] = []
    
    for (const credential of credentials) {
      const result = await this.checkCredentialFreshness(credential.id)
      results.push(result)
    }
    
    return results
  }
}

export const freshnessService = new FreshnessService()