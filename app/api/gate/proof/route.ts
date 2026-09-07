import { NextRequest, NextResponse } from 'next/server'
import { fetchInclusionProof } from '@/lib/credlock/attest'
import { loadCredLockConfig } from '@/lib/credlock/config'

/**
 * GET /api/gate/proof?txHash=0x...
 * Builds an Attestcoin inclusion proof for a Sepolia transaction from public
 * data only (public RPC + public proof builder). No key, no authority: the
 * proof is verified on-chain by the gate's precompile call, so a bad proof
 * here simply reverts there. This is a convenience helper, not a trust point.
 */
export async function GET(request: NextRequest) {
  try {
    const txHash = request.nextUrl.searchParams.get('txHash')
    if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json({ error: 'txHash must be a 0x-prefixed 32-byte hex string' }, { status: 400 })
    }
    const cfg = loadCredLockConfig()
    if (!cfg.sepoliaRpcUrl) {
      return NextResponse.json({ error: 'source RPC not configured' }, { status: 503 })
    }
    const proof = await fetchInclusionProof(txHash, {
      sepoliaRpcUrl: cfg.sepoliaRpcUrl,
      proofBuilderUrl: cfg.proofBuilderUrl,
    })
    return NextResponse.json(proof)
  } catch (error) {
    return NextResponse.json(
      { error: 'proof build failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
