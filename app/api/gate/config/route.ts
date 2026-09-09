import { NextResponse } from 'next/server'
import { loadCredLockConfig } from '@/lib/credlock/config'

/**
 * GET /api/gate/config
 * Public contract addresses so the client can build writes
 * (e.g. first-time registration) with no asset loaded yet.
 */
export async function GET() {
  try {
    const cfg = loadCredLockConfig()
    if (!cfg.gateAddress || !cfg.registryAddress) {
      return NextResponse.json({ error: 'gate not configured' }, { status: 503 })
    }
    return NextResponse.json({
      gateAddress: cfg.gateAddress,
      registryAddress: cfg.registryAddress,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'config failed' },
      { status: 500 },
    )
  }
}
