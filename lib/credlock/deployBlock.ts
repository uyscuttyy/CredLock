import type { JsonRpcProvider } from 'ethers'

const cache = new Map<string, number>()

/**
 * First block where `address` holds contract code, via binary search.
 * Cached per chain+address for the process lifetime. An explicit env
 * override (pin from explorer once known) skips the search entirely.
 */
export async function findDeploymentBlock(
  provider: JsonRpcProvider,
  address: string,
  envOverride?: string,
): Promise<number> {
  if (envOverride) {
    const pinned = Number.parseInt(envOverride, 10)
    if (Number.isSafeInteger(pinned) && pinned >= 0) return pinned
  }
  const chainId = Number((await provider.getNetwork()).chainId)
  const key = `${chainId}:${address.toLowerCase()}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  let lo = 0
  let hi = await provider.getBlockNumber()
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const code = await provider.getCode(address, mid)
    if (code === '0x') lo = mid + 1
    else hi = mid
  }
  cache.set(key, lo)
  return lo
}
