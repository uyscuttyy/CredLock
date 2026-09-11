/**
 * Submit a fused Borrow (proof inside the financing transaction) or dry-run it.
 * Usage:
 *   node scripts/credlock/fused-borrow.mjs <proof.json> <assetId> [--dry-run]
 * Env: DEPLOYER_PRIVATE_KEY, CREDLOCK_GATE_ADDRESS, CREDITCOIN_TESTNET_RPC_URL
 * Reads DEPLOYER_PRIVATE_KEY from .env if not exported.
 */
import fs from 'node:fs'
import path from 'node:path'
import { JsonRpcProvider, Wallet, Contract } from '../../node_modules/ethers/lib.commonjs/ethers.js'

const root = path.resolve(process.argv[1], '..', '..', '..')
for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
  const i = line.indexOf('=')
  if (i > 0 && !(line.trim().startsWith('#'))) {
    const k = line.slice(0, i).trim()
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
  }
}

const ABI = [
  'function requestFinancingWithProof(bytes32 assetId, uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bool)',
]
const provider = new JsonRpcProvider(
  process.env.CREDITCOIN_TESTNET_RPC_URL ?? 'https://rpc.cc3-testnet.creditcoin.network',
)
const gate = new Contract(process.env.CREDLOCK_GATE_ADDRESS, ABI, provider)

const proof = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const assetId = process.argv[3]
const args = [
  assetId,
  proof.chainKey,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleRoot,
  proof.siblings,
  proof.lowerEndpointDigest,
  proof.continuityRoots,
]

if (process.argv.includes('--dry-run')) {
  try {
    await gate.requestFinancingWithProof.staticCall(...args)
    console.log('dry-run: WOULD SUCCEED')
  } catch (e) {
    console.log('dry-run: WOULD REVERT:', String(e).slice(0, 200))
  }
  process.exit(0)
}

const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
const tx = await gate.connect(wallet).requestFinancingWithProof(...args)
console.log('sent:', tx.hash)
const rcpt = await tx.wait()
console.log('status:', rcpt.status === 1 ? 'SUCCESS' : 'REVERTED', '| block:', rcpt.blockNumber)
process.exit(0)
