import { NextRequest, NextResponse } from 'next/server'
import { JsonRpcProvider, id, getAddress } from 'ethers'
import { gateContract, readVerdict } from '@/lib/credlock/gate'
import { registryContract } from '@/lib/credlock/registry'
import { findDeploymentBlock } from '@/lib/credlock/deployBlock'
import { scanLogs } from '@/lib/credlock/logs'
import { registryLogs } from '@/lib/credlock/registryLogs'
import { CREDLOCK_CHAIN, loadCredLockConfig } from '@/lib/credlock/config'

const VERDICTS = ['NONE', 'ALLOW', 'BLOCK'] as const
const REGISTER_SIG = id('AssetRegistered(bytes32,address)')
const PLEDGE_SIG = id('AssetPledged(bytes32,address)')
const VERDICT_RECORDED_SIG = id('VerdictRecorded(bytes32,uint8,bytes32)')
const FINANCED_SIG = id('FinancingExecuted(bytes32,address)')

const SEPOLIA_TX = 'https://sepolia.etherscan.io/tx/'
const CC_TX = 'https://creditcoin-testnet.blockscout.com/tx/'

export interface AssetStep {
  step: string
  chain: string
  txHash?: string
  detail: string
  explorer?: string
}

/**
 * GET /api/gate/asset?assetId=0x...
 * The whole product truth for one asset, derived only from chain state:
 * Sepolia registry events + views, Creditcoin gate verdict + events.
 * No files, no allowlist, no server key. Unknown assets return
 * UNVERIFIED with empty history — that IS the answer for them.
 */
export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get('assetId')
    if (!assetId || !/^0x[0-9a-fA-F]{64}$/.test(assetId)) {
      return NextResponse.json({ error: 'assetId must be a 0x-prefixed bytes32 hex string' }, { status: 400 })
    }

    const cfg = loadCredLockConfig()
    if (!cfg.gateAddress || !cfg.registryAddress || !cfg.sepoliaRpcUrl) {
      return NextResponse.json({ error: 'gate not configured' }, { status: 503 })
    }

    const sepolia = new JsonRpcProvider(cfg.sepoliaRpcUrl)
    const cc = new JsonRpcProvider(cfg.creditcoinRpcUrl)
    const registry = registryContract(cfg.registryAddress, sepolia)
    const gate = gateContract(cfg.gateAddress, cc)

    // Log scans start at each contract's deployment block: the Sepolia RPC
    // caps ranges at 50k blocks, and 'earliest' is rejected outright.
    const [sepoliaDeploy, ccDeploy] = await Promise.all([
      findDeploymentBlock(
        sepolia,
        getAddress(cfg.registryAddress),
        process.env.SOURCE_DEPLOY_BLOCK,
      ),
      findDeploymentBlock(cc, getAddress(cfg.gateAddress), process.env.GATE_DEPLOY_BLOCK),
    ])

    const regAddr = getAddress(cfg.registryAddress)
    const gateAddr = getAddress(cfg.gateAddress)
    // Sepolia history comes from the Blockscout indexer: the public RPC
    // rotates nodes and returns inconsistent results for historical getLogs.
    // Views (owner/pledged) stay on RPC: latest-state reads are consistent.
    const [owner, pledged, verdict, financed, indexed, verdictLogs, finLogs] =
      await Promise.all([
        registry.assetOwner(assetId) as Promise<string>,
        registry.isPledged(assetId) as Promise<boolean>,
        readVerdict(gate, assetId),
        gate.financed(assetId) as Promise<boolean>,
        registryLogs(regAddr, assetId),
        scanLogs(cc, { address: gateAddr, topics: [VERDICT_RECORDED_SIG, assetId] }, ccDeploy),
        scanLogs(cc, { address: gateAddr, topics: [FINANCED_SIG, assetId] }, ccDeploy),
      ])
    const regLogs = indexed.registered
    const pledgeLogs = indexed.pledged

    const steps: AssetStep[] = []
    for (const l of regLogs) {
      steps.push({
        step: 'registered',
        chain: CREDLOCK_CHAIN.sourceChainName,
        txHash: l.txHash,
        detail: 'AssetRegistered — CLEAR fact',
        explorer: SEPOLIA_TX + l.txHash,
      })
    }
    for (const l of pledgeLogs) {
      steps.push({
        step: 'pledged',
        chain: CREDLOCK_CHAIN.sourceChainName,
        txHash: l.txHash,
        detail: 'AssetPledged — ENCUMBERED fact',
        explorer: SEPOLIA_TX + l.txHash,
      })
    }
    for (const l of verdictLogs) {
      steps.push({
        step: 'verdict-recorded',
        chain: 'Creditcoin',
        txHash: l.transactionHash,
        detail: `precompile-verified verdict on chain (verdict=${VERDICTS[verdict] ?? '?'})`,
        explorer: CC_TX + l.transactionHash,
      })
    }
    for (const l of finLogs) {
      steps.push({
        step: 'financed',
        chain: 'Creditcoin',
        txHash: l.transactionHash,
        detail: 'FinancingExecuted',
        explorer: CC_TX + l.transactionHash,
      })
    }

    return NextResponse.json({
      asset: assetId,
      owner,
      pledged: Boolean(pledged),
      verdict: VERDICTS[verdict] ?? 'UNKNOWN',
      reason: verdict === 1 ? 'CLEAR' : verdict === 2 ? 'ENCUMBERED' : 'UNVERIFIED',
      financed: Boolean(financed),
      verificationStatus: verdict === 0 ? 'UNVERIFIED' : 'VERIFIED',
      sourceChain: CREDLOCK_CHAIN.sourceChainName,
      gateAddress: cfg.gateAddress,
      registryAddress: cfg.registryAddress,
      steps,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'chain read failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
