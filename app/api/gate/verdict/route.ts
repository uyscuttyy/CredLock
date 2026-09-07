import { NextRequest, NextResponse } from 'next/server'
import { JsonRpcProvider } from 'ethers'
import { gateContract, readVerdict } from '@/lib/credlock/gate'
import { CREDLOCK_CHAIN, loadCredLockConfig } from '@/lib/credlock/config'

const VERDICTS = ['NONE', 'ALLOW', 'BLOCK'] as const;

/**
 * GET /api/gate/verdict?assetId=0x...
 * Live on-chain read of the machine-checkable CredLock verdict.
 * No backend assertion: the value comes straight from CredLockGate.
 */
export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get('assetId')
    if (!assetId || !/^0x[0-9a-fA-F]{64}$/.test(assetId)) {
      return NextResponse.json({ error: 'assetId must be a 0x-prefixed bytes32 hex string' }, { status: 400 })
    }

    const cfg = loadCredLockConfig()
    if (!cfg.gateAddress) {
      return NextResponse.json(
        { error: 'CredLock gate not deployed yet. Set CREDLOCK_GATE_ADDRESS.' },
        { status: 503 },
      )
    }

    const provider = new JsonRpcProvider(cfg.creditcoinRpcUrl)
    const gate = gateContract(cfg.gateAddress, provider)
    const [verdict, financed, sourceRegistry, sourceChainKey] = await Promise.all([
      readVerdict(gate, assetId),
      gate.financed(assetId) as Promise<boolean>,
      gate.sourceRegistry() as Promise<string>,
      gate.sourceChainKey() as Promise<bigint>,
    ])

    return NextResponse.json({
      asset: assetId,
      verdict: VERDICTS[verdict] ?? 'UNKNOWN',
      reason: verdict === 1 ? 'CLEAR' : verdict === 2 ? 'ENCUMBERED' : 'UNVERIFIED',
      financed: Boolean(financed),
      verificationStatus: verdict === 0 ? 'UNVERIFIED' : 'VERIFIED',
      sourceChain: CREDLOCK_CHAIN.sourceChainName,
      sourceChainKey: Number(sourceChainKey),
      gateAddress: cfg.gateAddress,
      registryAddress: cfg.registryAddress || sourceRegistry,
      explorer: `https://creditcoin-testnet.blockscout.com/address/${cfg.gateAddress}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'verdict read failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
