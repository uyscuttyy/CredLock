import { prisma } from '@/lib/prisma'
import { getAllChainAdapters } from '@/lib/blockchain'
import type { BlockchainActivity } from '@/types/blockchain'
import { formatTokenAmount } from '@/lib/utils'

export class ActivityService {
  async discoverActivities(walletAddress: string): Promise<BlockchainActivity[]> {
    const adapters = getAllChainAdapters()
    const activities: BlockchainActivity[] = []
    
    for (const adapter of adapters) {
      try {
        const chainActivities = await adapter.discoverActivity(walletAddress)
        activities.push(...chainActivities)
      } catch (error) {
        console.error(`Failed to discover activities for chain ${adapter.chainName}:`, error)
      }
    }
    
    return activities
  }
  
  async persistActivities(
    walletAddress: string,
    activities: BlockchainActivity[]
  ): Promise<void> {
    const wallet = await prisma.wallet.upsert({
      where: { address: walletAddress },
      create: { address: walletAddress },
      update: {},
    })
    
    for (const activity of activities) {
      const chain = await prisma.chain.upsert({
        where: { chainId: activity.chainId },
        create: {
          name: activity.chainName,
          chainId: activity.chainId,
        },
        update: {},
      })
      
      try {
        await prisma.activity.create({
          data: {
            walletId: wallet.id,
            chainId: chain.id,
            activityType: activity.activityType,
            txHash: activity.txHash,
            blockNumber: activity.blockNumber,
            blockTimestamp: new Date(activity.blockTimestamp * 1000),
            amount: activity.amount ? activity.amount.toString() : null,
            asset: activity.asset,
            metadata: activity.metadata ? JSON.parse(JSON.stringify(activity.metadata)) : undefined,
          },
        })
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error('Failed to persist activity:', error)
        }
      }
    }
  }
  
  async getWalletActivities(walletAddress: string): Promise<any[]> {
    const activities = await prisma.activity.findMany({
      where: {
        wallet: { address: walletAddress },
      },
      include: {
        chain: true,
        protocol: true,
      },
      orderBy: {
        blockTimestamp: 'desc',
      },
    })
    
    return activities.map(activity => ({
      id: activity.id,
      activityType: activity.activityType,
      txHash: activity.txHash,
      blockNumber: activity.blockNumber.toString(),
      blockTimestamp: activity.blockTimestamp,
      amount: activity.amount ? formatTokenAmount(BigInt(activity.amount.toString())) : null,
      asset: activity.asset,
      chain: activity.chain.name,
      protocol: activity.protocol?.name || null,
    }))
  }
  
  async countActivitiesByType(walletAddress: string): Promise<Record<string, number>> {
    const activities = await prisma.activity.groupBy({
      by: ['activityType'],
      where: {
        wallet: { address: walletAddress },
      },
      _count: true,
    })
    
    const counts: Record<string, number> = {}
    activities.forEach(activity => {
      counts[activity.activityType] = activity._count
    })
    
    return counts
  }
  
  async getRelevantEventsForCredential(
    walletAddress: string,
    credentialType: string,
    checkpoint: { chainId: number; blockNumber: bigint; timestamp: number }
  ): Promise<BlockchainActivity[]> {
    const { getChainAdapter } = await import('@/lib/blockchain')
    const adapter = getChainAdapter(checkpoint.chainId)
    
    if (!adapter) return []
    
    const relevantTypes = this.getRelevantActivityTypes(credentialType)
    const events = await adapter.getRelevantEvents(walletAddress, {
      chainId: checkpoint.chainId,
      blockNumber: checkpoint.blockNumber,
      timestamp: checkpoint.timestamp,
    })
    
    return events.filter(event => relevantTypes.includes(event.activityType))
  }
  
  private getRelevantActivityTypes(credentialType: string): string[] {
    switch (credentialType) {
      case 'repayment_history':
        return ['borrow', 'repayment', 'liquidation']
      case 'borrowing_history':
        return ['borrow', 'repayment', 'liquidation']
      case 'collateral_history':
        return ['collateral_change', 'liquidation']
      case 'asset_ownership':
        return ['collateral_change']
      default:
        return []
    }
  }
}

export const activityService = new ActivityService()