import type { JsonRpcProvider, Log } from 'ethers'

const DEFAULT_CHUNK = 50_000

/**
 * eth_getLogs over [fromBlock, latest], split into capped chunks.
 * Some RPCs reject wide ranges (Sepolia public: 50k blocks); chunking
 * keeps the scan working on any compliant endpoint.
 */
export async function scanLogs(
  provider: JsonRpcProvider,
  filter: { address: string; topics: Array<string | null> },
  fromBlock: number,
  chunkSize = DEFAULT_CHUNK,
): Promise<Log[]> {
  const latest = await provider.getBlockNumber()
  const ranges: Array<{ from: number; to: number }> = []
  for (let from = fromBlock; from <= latest; from += chunkSize) {
    ranges.push({ from, to: Math.min(from + chunkSize - 1, latest) })
  }
  const pages = await Promise.all(
    ranges.map((r) =>
      provider.getLogs({ ...filter, fromBlock: r.from, toBlock: r.to }),
    ),
  )
  return pages.flat()
}
