import { createPublicClient, http, PublicClient } from 'viem'
import { arbitrum } from 'viem/chains'
import type { SourceChainAdapter, BlockchainActivity, Checkpoint, Transaction } from '@/types/blockchain'
import { AaveAdapter } from '@/lib/blockchain/protocols/AaveAdapter'

export class ArbitrumAdapter implements SourceChainAdapter {
    chainId = arbitrum.id
    chainName = 'Arbitrum'

    private client: PublicClient = createPublicClient({
        chain: arbitrum,
        transport: http(process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo'),
    }) as PublicClient

    private aaveV3Adapter = new AaveAdapter(
        this.client,
        'Aave V3',
        arbitrum.id,
        process.env.AAVE_V3_ARBITRUM_POOL || '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
    )

    async discoverActivity(walletAddress: string): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const aaveActivities = await Promise.all([
                this.aaveV3Adapter.getBorrowEvents(walletAddress),
                this.aaveV3Adapter.getRepaymentEvents(walletAddress),
                this.aaveV3Adapter.getLiquidationEvents(walletAddress),
                this.aaveV3Adapter.getCollateralEvents(walletAddress),
            ])

            activities.push(...aaveActivities.flat())
        } catch (error) {
            console.error(`Error discovering Arbitrum activities:`, error)
        }

        return activities
    }

    async getRelevantEvents(walletAddress: string, checkpoint: Checkpoint): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const aaveActivities = await Promise.all([
                this.aaveV3Adapter.getBorrowEvents(walletAddress, checkpoint.blockNumber),
                this.aaveV3Adapter.getRepaymentEvents(walletAddress, checkpoint.blockNumber),
                this.aaveV3Adapter.getLiquidationEvents(walletAddress, checkpoint.blockNumber),
                this.aaveV3Adapter.getCollateralEvents(walletAddress, checkpoint.blockNumber),
            ])

            activities.push(...aaveActivities.flat())
        } catch (error) {
            console.error(`Error getting relevant Arbitrum events:`, error)
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
            chainId: arbitrum.id,
        }
    }

    async getCurrentBlock(): Promise<number> {
        const block = await this.client.getBlockNumber()
        return Number(block)
    }
}