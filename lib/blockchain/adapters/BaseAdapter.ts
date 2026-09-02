import { createPublicClient, http, PublicClient } from 'viem'
import { base } from 'viem/chains'
import type { SourceChainAdapter, BlockchainActivity, Checkpoint, Transaction } from '@/types/blockchain'
import { AaveAdapter } from '@/lib/blockchain/protocols/AaveAdapter'

export class BaseAdapter implements SourceChainAdapter {
    chainId = base.id
    chainName = 'Base'

    private client: PublicClient = createPublicClient({
        chain: base,
        transport: http(process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo'),
    }) as PublicClient

    private aaveAdapter = new AaveAdapter(this.client, 'Aave V3', base.id)

    async discoverActivity(walletAddress: string): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const aaveActivities = await Promise.all([
                this.aaveAdapter.getBorrowEvents(walletAddress),
                this.aaveAdapter.getRepaymentEvents(walletAddress),
                this.aaveAdapter.getLiquidationEvents(walletAddress),
                this.aaveAdapter.getCollateralEvents(walletAddress),
            ])

            activities.push(...aaveActivities.flat())
        } catch (error) {
            console.error(`Error discovering Base activities:`, error)
        }

        return activities
    }

    async getRelevantEvents(walletAddress: string, checkpoint: Checkpoint): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const aaveActivities = await Promise.all([
                this.aaveAdapter.getBorrowEvents(walletAddress, checkpoint.blockNumber),
                this.aaveAdapter.getRepaymentEvents(walletAddress, checkpoint.blockNumber),
                this.aaveAdapter.getLiquidationEvents(walletAddress, checkpoint.blockNumber),
                this.aaveAdapter.getCollateralEvents(walletAddress, checkpoint.blockNumber),
            ])

            activities.push(...aaveActivities.flat())
        } catch (error) {
            console.error(`Error getting relevant Base events:`, error)
        }

        return activities
    }

    async getTransaction(txHash: string): Promise<Transaction> {
        const tx = await this.client.getTransaction({ hash: txHash as `0x${string}` })
        const receipt = await this.client.getTransactionReceipt({ hash: txHash as `0x${string}` })
        const block = await this.client.getBlock({ blockNumber: receipt.blockNumber })

        return {
            hash: tx.hash,
            blockNumber: receipt.blockNumber,
            timestamp: Number(block.timestamp),
            from: tx.from,
            to: tx.to || '',
            value: tx.value,
            chainId: base.id,
        }
    }

    async getCurrentBlock(): Promise<number> {
        const block = await this.client.getBlockNumber()
        return Number(block)
    }
}