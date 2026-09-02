import { createPublicClient, http, PublicClient } from 'viem'
import { mainnet } from 'viem/chains'
import type { SourceChainAdapter, BlockchainActivity, Checkpoint, Transaction } from '@/types/blockchain'
import { AaveAdapter } from '@/lib/blockchain/protocols/AaveAdapter'

export class EthereumAdapter implements SourceChainAdapter {
    chainId = mainnet.id
    chainName = 'Ethereum'

    private client: PublicClient = createPublicClient({
        chain: mainnet,
        transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    }) as PublicClient

    private aaveV2Adapter = new AaveAdapter(
        this.client,
        'Aave V2',
        mainnet.id,
        process.env.AAVE_V2_ETHEREUM_POOL || '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
    )

    private aaveV3Adapter = new AaveAdapter(
        this.client,
        'Aave V3',
        mainnet.id,
        process.env.AAVE_V3_ETHEREUM_POOL || '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
    )

    async discoverActivity(walletAddress: string): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const [v2Activities, v3Activities] = await Promise.all([
                Promise.all([
                    this.aaveV2Adapter.getBorrowEvents(walletAddress),
                    this.aaveV2Adapter.getRepaymentEvents(walletAddress),
                    this.aaveV2Adapter.getLiquidationEvents(walletAddress),
                    this.aaveV2Adapter.getCollateralEvents(walletAddress),
                ]),
                Promise.all([
                    this.aaveV3Adapter.getBorrowEvents(walletAddress),
                    this.aaveV3Adapter.getRepaymentEvents(walletAddress),
                    this.aaveV3Adapter.getLiquidationEvents(walletAddress),
                    this.aaveV3Adapter.getCollateralEvents(walletAddress),
                ]),
            ])

            activities.push(...v2Activities.flat(), ...v3Activities.flat())
        } catch (error) {
            console.error(`Error discovering Ethereum activities:`, error)
        }

        return activities
    }

    async getRelevantEvents(walletAddress: string, checkpoint: Checkpoint): Promise<BlockchainActivity[]> {
        const activities: BlockchainActivity[] = []

        try {
            const [v2Activities, v3Activities] = await Promise.all([
                Promise.all([
                    this.aaveV2Adapter.getBorrowEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV2Adapter.getRepaymentEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV2Adapter.getLiquidationEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV2Adapter.getCollateralEvents(walletAddress, checkpoint.blockNumber),
                ]),
                Promise.all([
                    this.aaveV3Adapter.getBorrowEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV3Adapter.getRepaymentEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV3Adapter.getLiquidationEvents(walletAddress, checkpoint.blockNumber),
                    this.aaveV3Adapter.getCollateralEvents(walletAddress, checkpoint.blockNumber),
                ]),
            ])

            activities.push(...v2Activities.flat(), ...v3Activities.flat())
        } catch (error) {
            console.error(`Error getting relevant Ethereum events:`, error)
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
            chainId: mainnet.id,
        }
    }

    async getCurrentBlock(): Promise<number> {
        const block = await this.client.getBlockNumber()
        return Number(block)
    }
}