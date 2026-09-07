import { defineChain } from 'viem'
import { sepolia } from 'wagmi/chains'

/** Creditcoin CC3 testnet (EVM). Chain ID verified against docs + live RPC. */
export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: { name: 'tCTC', symbol: 'tCTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://creditcoin-testnet.blockscout.com',
    },
  },
})

export { sepolia }
