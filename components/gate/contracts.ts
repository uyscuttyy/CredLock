import type { Abi } from 'viem'

export const REGISTRY_ABI: Abi = [
  {
    name: 'registerAsset',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'pledgeAsset',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [],
  },
]

export const GATE_ABI: Abi = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'action', type: 'uint8' },
      { name: 'chainKey', type: 'uint64' },
      { name: 'blockHeight', type: 'uint64' },
      { name: 'encodedTransaction', type: 'bytes' },
      { name: 'merkleRoot', type: 'bytes32' },
      {
        name: 'siblings',
        type: 'tuple[]',
        components: [
          { name: 'hash', type: 'bytes32' },
          { name: 'isLeft', type: 'bool' },
        ],
      },
      { name: 'lowerEndpointDigest', type: 'bytes32' },
      { name: 'continuityRoots', type: 'bytes32[]' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'requestFinancing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
  },
]

export const CC_TX = 'https://creditcoin-testnet.blockscout.com/tx/'
export const SEPOLIA_TX = 'https://sepolia.etherscan.io/tx/'
