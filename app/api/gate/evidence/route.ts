import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * GET /api/gate/evidence?assetId=0x...
 * Serves the inspectable evidence chain recorded by scripts/credlock/demo.ts:
 * every real tx hash from both attempts, in order. No fabricated data: if no
 * demo has been run for the asset, this returns 404.
 */
export async function GET(request: NextRequest) {
  const assetId = request.nextUrl.searchParams.get('assetId')
  if (!assetId || !/^0x[0-9a-fA-F]{64}$/.test(assetId)) {
    return NextResponse.json({ error: 'assetId must be a 0x-prefixed bytes32 hex string' }, { status: 400 })
  }
  try {
    const raw = await readFile(join(process.cwd(), 'demo-evidence', `${assetId}.json`), 'utf8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json(
      { error: 'no recorded demo for this asset', hint: 'run scripts/credlock/demo.ts first' },
      { status: 404 },
    )
  }
}
