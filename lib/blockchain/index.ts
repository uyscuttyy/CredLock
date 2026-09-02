import { EthereumAdapter } from '@/lib/blockchain/adapters/EthereumAdapter'
import { BaseAdapter } from '@/lib/blockchain/adapters/BaseAdapter'
import { ArbitrumAdapter } from '@/lib/blockchain/adapters/ArbitrumAdapter'
import type { SourceChainAdapter } from '@/types/blockchain'

export const chainAdapters: Record<number, SourceChainAdapter> = {
    1: new EthereumAdapter(),
    8453: new BaseAdapter(),
    42161: new ArbitrumAdapter(),
}

export function getChainAdapter(chainId: number): SourceChainAdapter | undefined {
    return chainAdapters[chainId]
}

export function getAllChainAdapters(): SourceChainAdapter[] {
    return Object.values(chainAdapters)
}

export * from './adapters/EthereumAdapter'
export * from './adapters/BaseAdapter'
export * from './adapters/ArbitrumAdapter'
export * from './protocols/AaveAdapter'