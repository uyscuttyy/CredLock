export interface AssetStep {
  step: string
  chain: string
  txHash?: string
  detail: string
  explorer?: string
}

export interface AssetState {
  asset: string
  owner: string
  pledged: boolean
  verdict: string
  reason: string
  financed: boolean
  verificationStatus: string
  gateAddress: string
  registryAddress: string
  steps: AssetStep[]
}

export interface Proof {
  chainKey: number
  headerNumber: number
  txHash: string
  txBytes: `0x${string}`
  merkleRoot: `0x${string}`
  siblings: Array<{ hash: `0x${string}`; isLeft: boolean }>
  lowerEndpointDigest: `0x${string}`
  continuityRoots: Array<`0x${string}`>
  cached: boolean
  proofBuilderUrl: string
}

export function isValidAssetId(id: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(id)
}
