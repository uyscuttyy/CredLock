import { PublicClient, parseAbi } from 'viem'
import type { ProtocolAdapter, BlockchainActivity } from '@/types/blockchain'

const AAVE_POOL_ABI = parseAbi([
    'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 interestRateMode, uint256 borrowRate, uint16 indexed referral)',
    'event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount)',
    'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
    'event Deposit(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)',
    'event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)',
])

export class AaveAdapter implements ProtocolAdapter {
    protocolName: string
    protocolType = 'lending'

    constructor(
        private client: PublicClient,
        name: string = 'Aave',
        private chainId: number,
        private poolAddress: string = process.env.AAVE_V3_ETHEREUM_POOL || '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
    ) {
        this.protocolName = name
    }

    private async getEvents(
        walletAddress: string,
        eventName: string,
        fromBlock?: bigint
    ): Promise<BlockchainActivity[]> {
        try {
            const logs = await this.client.getLogs({
                address: this.poolAddress as `0x${string}`,
                event: {
                    type: 'event',
                    name: eventName,
                } as any,
                args: {
                    onBehalfOf: walletAddress as `0x${string}`,
                    user: walletAddress as `0x${string}`,
                } as any,
                fromBlock: fromBlock || 0n,
            })

            return logs.map((log: any) => ({
                chainId: this.chainId,
                chainName: this.getChainName(),
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                blockTimestamp: 0,
                protocol: this.protocolName,
                activityType: this.mapEventToActivityType(eventName),
                amount: log.args.amount,
                asset: log.args.reserve || log.args.collateralAsset || log.args.debtAsset,
            }))
        } catch (error) {
            console.error(`Error fetching ${eventName} events from ${this.protocolName}:`, error)
            return []
        }
    }

    private getChainName(): string {
        if (this.chainId === 1) return 'Ethereum'
        if (this.chainId === 8453) return 'Base'
        if (this.chainId === 42161) return 'Arbitrum'
        return 'Unknown'
    }

    private mapEventToActivityType(eventName: string): BlockchainActivity['activityType'] {
        switch (eventName) {
            case 'Borrow':
                return 'borrow'
            case 'Repay':
                return 'repayment'
            case 'LiquidationCall':
                return 'liquidation'
            case 'Deposit':
            case 'Withdraw':
                return 'collateral_change'
            default:
                return 'other'
        }
    }

    async getBorrowEvents(walletAddress: string, fromBlock?: bigint): Promise<BlockchainActivity[]> {
        return this.getEvents(walletAddress, 'Borrow', fromBlock)
    }

    async getRepaymentEvents(walletAddress: string, fromBlock?: bigint): Promise<BlockchainActivity[]> {
        return this.getEvents(walletAddress, 'Repay', fromBlock)
    }

    async getLiquidationEvents(walletAddress: string, fromBlock?: bigint): Promise<BlockchainActivity[]> {
        return this.getEvents(walletAddress, 'LiquidationCall', fromBlock)
    }

    async getCollateralEvents(walletAddress: string, fromBlock?: bigint): Promise<BlockchainActivity[]> {
        const deposits = await this.getEvents(walletAddress, 'Deposit', fromBlock)
        const withdrawals = await this.getEvents(walletAddress, 'Withdraw', fromBlock)
        return [...deposits, ...withdrawals]
    }
}