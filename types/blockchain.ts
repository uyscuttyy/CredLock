export interface ChainConfig {
    id: number
    name: string
    rpcUrl: string
    nativeCurrency: {
        name: string
        symbol: string
        decimals: number
    }
    explorerUrl?: string
}

export interface SourceChainAdapter {
    chainId: number
    chainName: string
    discoverActivity(walletAddress: string): Promise<BlockchainActivity[]>
    getRelevantEvents(walletAddress: string, checkpoint: Checkpoint): Promise<BlockchainActivity[]>
    getTransaction(txHash: string): Promise<Transaction>
    getCurrentBlock(): Promise<number>
}

export interface ProtocolAdapter {
    protocolName: string
    protocolType: string
    getBorrowEvents(walletAddress: string): Promise<BlockchainActivity[]>
    getRepaymentEvents(walletAddress: string): Promise<BlockchainActivity[]>
    getLiquidationEvents(walletAddress: string): Promise<BlockchainActivity[]>
    getCollateralEvents(walletAddress: string): Promise<BlockchainActivity[]>
}

export interface BlockchainActivity {
    chainId: number
    chainName: string
    txHash: string
    blockNumber: bigint
    blockTimestamp: number
    protocol?: string
    activityType: 'borrow' | 'repayment' | 'liquidation' | 'collateral_change' | 'other'
    amount?: bigint
    asset?: string
    metadata?: Record<string, unknown>
}

export interface Checkpoint {
    chainId: number
    blockNumber: bigint
    blockHash?: string
    timestamp: number
}

export interface Transaction {
    hash: string
    blockNumber: bigint
    timestamp: number
    from: string
    to: string
    value: bigint
    chainId: number
}