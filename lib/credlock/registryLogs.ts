const SEPOLIA_BLOCKSCOUT = 'https://eth-sepolia.blockscout.com/api/v2';

export interface IndexedLog {
  txHash: string;
  blockNumber: number;
  signature: string;
}

interface BlockscoutLogItem {
  transaction_hash?: string;
  block_number?: number;
  topics?: string[];
}

/**
 * Event history for the source registry from the Blockscout indexer.
 * The public Sepolia RPC rotates/prunes nodes and returns inconsistent
 * results for historical getLogs; the indexer is deterministic.
 * Client filters by event signature + asset id (topic1).
 */
export async function registryLogs(
  registryAddress: string,
  assetId: string,
): Promise<{ registered: IndexedLog[]; pledged: IndexedLog[] }> {
  const registered: IndexedLog[] = [];
  const pledged: IndexedLog[] = [];
  let nextParams: string | null = null;
  const wanted = assetId.toLowerCase();

  for (let pages = 0; pages < 20; pages++) {
    const url =
      `${SEPOLIA_BLOCKSCOUT}/addresses/${registryAddress}/logs` +
      (nextParams ? `?${nextParams}` : '');
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`blockscout logs failed: ${res.status}`);
    const body = (await res.json()) as {
      items?: BlockscoutLogItem[];
      next_page_params?: Record<string, string | number> | null;
    };
    for (const item of body.items ?? []) {
      const topics = (item.topics ?? [])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase());
      if (topics.length < 2 || topics[1] !== wanted) continue;
      const entry: IndexedLog = {
        txHash: item.transaction_hash ?? '',
        blockNumber: Number(item.block_number ?? 0),
        signature: topics[0],
      };
      if (!entry.txHash) continue;
      if (entry.signature === REGISTER_SIG) registered.push(entry);
      else if (entry.signature === PLEDGE_SIG) pledged.push(entry);
    }
    if (!body.next_page_params) break;
    nextParams = new URLSearchParams(
      Object.entries(body.next_page_params).map(([k, v]) => [k, String(v)]),
    ).toString();
  }
  return { registered, pledged };
}

export const REGISTER_SIG =
  '0x7b8c7b505365aa1b7f9ce04295e6da7c743d877f121b9debcf6a8a9d1806ce46';
export const PLEDGE_SIG =
  '0xec5c820b7ea68dd3ff08d6f746b3ae69e53ae627cd04e4238a66c25427f0e0ba';
