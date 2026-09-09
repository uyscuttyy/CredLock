'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { type Abi, keccak256, stringToHex } from 'viem'
import { creditcoinTestnet, sepolia } from '@/lib/credlock/chains'

const REGISTRY_ABI: Abi = [
  {
    name: 'registerAsset',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'pledgeAsset',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [],
  },
]

const GATE_ABI: Abi = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'action', type: 'uint8' },
      { name: 'chainKey', type: 'uint64' },
      { name: 'blockHeight', type: 'uint64' },
      { name: 'encodedTransaction', type: 'bytes' },
      { name: 'merkleRoot', type: 'bytes32' },
      {
        name: 'siblings',
        type: 'tuple[]',
        components: [
          { name: 'hash', type: 'bytes32' },
          { name: 'isLeft', type: 'bool' },
        ],
      },
      { name: 'lowerEndpointDigest', type: 'bytes32' },
      { name: 'continuityRoots', type: 'bytes32[]' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'requestFinancing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
  },
]

const CC_TX = 'https://creditcoin-testnet.blockscout.com/tx/'
const SEPOLIA_TX = 'https://sepolia.etherscan.io/tx/'

interface AssetStep {
  step: string
  chain: string
  txHash?: string
  detail: string
  explorer?: string
}

interface AssetState {
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

interface Proof {
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

function Stamp({ value }: { value: string }) {
  const allow = value === 'ALLOW' || value === 'SUCCESS' || value === 'CLEAR'
  const blocked = value === 'BLOCK' || value === 'REVERTED' || value === 'ENCUMBERED'
  const cls = allow
    ? 'border-allow text-allow'
    : blocked
      ? 'border-block text-block'
      : 'border-ash/40 text-ash'
  return <span className={`verdict-stamp font-mono ${cls}`}>{value}</span>
}

/**
 * One wallet-signed transaction on a specific chain. Handles chain switching,
 * receipt tracking, and revert display. Nothing here touches a server key.
 */
function TxAction({
  label,
  chainId,
  chainName,
  address,
  abi,
  functionName,
  args,
  disabled,
  explorerBase,
  onConfirmed,
  danger,
}: {
  label: string
  chainId: number
  chainName: string
  address: string
  abi: Abi
  functionName: string
  args: unknown[]
  disabled?: boolean
  explorerBase: string
  onConfirmed: () => void
  danger?: boolean
}) {
  const curChain = useChainId()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { switchChain, isPending: switching } = useSwitchChain()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const write = useWriteContract() as any
  const receipt = useWaitForTransactionReceipt({ hash: write.data })
  const [seen, setSeen] = useState<string | null>(null)

  useEffect(() => {
    if (receipt.data && receipt.data.transactionHash !== seen) {
      setSeen(receipt.data.transactionHash)
      onConfirmed()
    }
  }, [receipt.data, seen, onConfirmed])

  const wrongChain = curChain !== chainId
  const reverted = receipt.data && receipt.data.status === 'reverted'

  return (
    <div className="mt-3">
      {!mounted ? (
        <button disabled className="rounded-lg border border-white/10 px-5 py-2 text-sm text-ash">
          {label}
        </button>
      ) : wrongChain ? (
        <button
          onClick={() => switchChain({ chainId })}
          disabled={switching}
          className="rounded-lg border border-bullion/70 px-5 py-2 text-sm font-semibold text-bone"
        >
          {switching ? 'Switching…' : `Switch to ${chainName}`}
        </button>
      ) : (
        <button
          onClick={() =>
            write.writeContract({ address: address as `0x${string}`, abi, functionName, args })
          }
          disabled={disabled || write.isPending || receipt.isLoading}
          className={`rounded-lg px-5 py-2 text-sm font-semibold text-carbon-950 disabled:opacity-50 ${
            danger ? 'bg-block' : 'bg-bullion'
          }`}
        >
          {write.isPending ? 'Confirm in wallet…' : receipt.isLoading ? 'Confirming…' : label}
        </button>
      )}
      {write.data && (
        <p className="mt-2 font-mono text-xs break-all">
          <a
            className="text-bullion-pale underline"
            href={explorerBase + write.data}
            target="_blank"
            rel="noopener noreferrer"
          >
            {write.data}
          </a>{' '}
          {receipt.isLoading && <span className="text-ash">confirming…</span>}
          {reverted && <span className="font-bold text-block">REVERTED on-chain</span>}
          {receipt.data && !reverted && <span className="font-bold text-allow">confirmed</span>}
        </p>
      )}
      {write.error && (
        <p className="mt-2 text-sm text-block">{write.error.message.slice(0, 240)}</p>
      )}
    </div>
  )
}

/** Build a public proof for one Sepolia tx, show it, then submit via wallet. */
function ProofSubmit({
  txHash,
  action,
  actionLabel,
  gateAddress,
  onConfirmed,
}: {
  txHash: string
  action: number
  actionLabel: string
  gateAddress: string
  onConfirmed: () => void
}) {
  const [proof, setProof] = useState<Proof | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function build() {
    setBuilding(true)
    setError(null)
    try {
      const res = await fetch(`/api/gate/proof?txHash=${txHash}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'proof build failed')
      setProof(body as Proof)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'proof build failed')
    } finally {
      setBuilding(false)
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-carbon-950/60 p-3">
      {!proof ? (
        <>
          <button
            onClick={build}
            disabled={building}
            className="rounded-lg border border-bullion/70 px-4 py-1.5 text-sm font-semibold text-bone disabled:opacity-50"
          >
            {building ? 'Waiting for attestation + proving… (minutes)' : `Prove ${actionLabel} on Creditcoin`}
          </button>
          {error && <p className="mt-2 text-sm text-block">{error}</p>}
        </>
      ) : (
        <>
          <p className="font-mono text-xs text-ash">
            block {proof.headerNumber} · chainKey {proof.chainKey} · cached={String(proof.cached)} ·
            siblings {proof.siblings.length} · roots {proof.continuityRoots.length}
          </p>
          <TxAction
            label={`Submit ${actionLabel} proof (signed by you)`}
            chainId={creditcoinTestnet.id}
            chainName="Creditcoin Testnet"
            address={gateAddress}
            abi={GATE_ABI}
            functionName="execute"
            args={[
              action,
              proof.chainKey,
              proof.headerNumber,
              proof.txBytes,
              proof.merkleRoot,
              proof.siblings,
              proof.lowerEndpointDigest,
              proof.continuityRoots,
            ]}
            explorerBase={CC_TX}
            onConfirmed={() => {
              setProof(null)
              onConfirmed()
            }}
          />
        </>
      )}
    </div>
  )
}

export default function GatePage() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [input, setInput] = useState('')
  const [state, setState] = useState<AssetState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // An asset id is either pasted 0x-hex or derived from any name/word by
  // hashing — the same name always yields the same id on every machine.
  const trimmed = input.trim()
  const isHex = /^0x[0-9a-fA-F]{64}$/.test(trimmed)
  const assetId = trimmed === '' ? '' : isHex ? trimmed : keccak256(stringToHex(trimmed))
  const valid = assetId !== ''

  const load = useCallback(async () => {
    const id = assetId
    if (!/^0x[0-9a-fA-F]{64}$/.test(id)) {
      setError('Enter a 0x bytes32 asset id, or generate a fresh one.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gate/asset?assetId=${id}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'load failed')
      setState(body as AssetState)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [assetId, refreshKey])

  function randomAsset() {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    setInput('0x' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(''))
    setState(null)
  }

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  useEffect(() => {
    if (valid) load()
  }, [refreshKey])

  const sepoliaTxs = (state?.steps ?? []).filter(
    (s) => s.chain.includes('Sepolia') && s.txHash && (s.step === 'registered' || s.step === 'pledged'),
  )

  return (
    <div className="container-custom py-12">
      <p className="font-mono text-sm text-ash">Creditcoin · Attestcoin · Sepolia</p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-bone md:text-5xl">
        Bring any asset. The chain decides.
      </h1>
      <p className="mt-4 max-w-3xl text-ash">
        Connect your wallet, register your asset on Sepolia, prove the fact on Creditcoin,
        and attempt financing: every write signed by you. Nothing here is preloaded;
        every outcome below is read live from chain state.
      </p>

      {mounted && !isConnected && (
        <p className="mt-6 rounded-lg border border-bullion/40 bg-bullion/10 p-4 text-sm font-semibold text-bone">
          Connect your wallet (top right): MetaMask on Sepolia and Creditcoin testnet.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Asset name (e.g. uyscutty) or 0x id"
          spellCheck={false}
          className="field-dark flex-1"
        />
        <button
          onClick={randomAsset}
          className="rounded-lg border border-bullion/70 px-5 py-2 text-sm font-semibold text-bone"
        >
          New asset
        </button>
        <button
          onClick={load}
          disabled={loading || !valid}
          className="rounded-lg bg-bullion px-6 py-2 text-sm font-semibold text-carbon-950 hover:bg-bullion-pale disabled:opacity-50"
        >
          {loading ? 'Reading chain…' : 'Read chain state'}
        </button>
      </div>
      {trimmed !== '' && (
        <p className="mt-2 font-mono text-xs text-ash break-all">
          {isHex ? 'Using pasted id' : `“${trimmed}” hashes to`} <span className="text-bullion-pale">{assetId}</span>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-block">{error}</p>}

      {state && (
        <>
          <section className={`carbon-panel mt-8 border-l-4 p-6 md:p-8 ${state.verdict === 'BLOCK' ? 'border-l-block' : state.verdict === 'ALLOW' ? 'border-l-allow' : 'border-l-bullion'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-ash">Live verdict · {state.verificationStatus}</p>
                <p className="mt-1 font-mono text-sm text-bone break-all">{state.asset}</p>
              </div>
              <Stamp value={state.verdict} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 font-sans text-sm text-bone sm:grid-cols-4">
              <div><dt className="text-ash">Reason</dt><dd className="mt-1 font-mono">{state.reason}</dd></div>
              <div><dt className="text-ash">Financed</dt><dd className="mt-1 font-mono">{String(state.financed)}</dd></div>
              <div><dt className="text-ash">Pledged (Sepolia)</dt><dd className="mt-1 font-mono">{String(state.pledged)}</dd></div>
              <div><dt className="text-ash">Owner</dt><dd className="mt-1 font-mono text-xs break-all">{state.owner}</dd></div>
            </dl>
          </section>

          {state.verdict === 'NONE' && state.steps.length === 0 && (
            <p className="mt-6 rounded-lg border border-dashed border-white/15 p-6 text-ash">
              No on-chain record for this asset. That is the honest answer for unknown ids.
              Register it below to create one.
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="carbon-panel p-6">
              <h2 className="font-display text-2xl text-bone">Source chain: your writes</h2>
              <p className="mt-1 text-sm text-ash">Signed by your wallet on Sepolia.</p>
              <TxAction
                label="Register asset (CLEAR fact)"
                chainId={sepolia.id}
                chainName="Sepolia"
                address={state.registryAddress}
                abi={REGISTRY_ABI}
                functionName="registerAsset"
                args={[state.asset]}
                disabled={!isConnected || !valid}
                explorerBase={SEPOLIA_TX}
                onConfirmed={refresh}
              />
              <TxAction
                label="Pledge asset (ENCUMBERED fact)"
                chainId={sepolia.id}
                chainName="Sepolia"
                address={state.registryAddress}
                abi={REGISTRY_ABI}
                functionName="pledgeAsset"
                args={[state.asset]}
                disabled={!isConnected || !valid}
                explorerBase={SEPOLIA_TX}
                onConfirmed={refresh}
                danger
              />
            </section>

            <section className="carbon-panel p-6">
              <h2 className="font-display text-2xl text-bone">Financing: the hard gate</h2>
              <p className="mt-1 text-sm text-ash">
                Signed by your wallet on Creditcoin. Reverts unless verdict is ALLOW.
              </p>
              <TxAction
                label="Attempt financing now"
                chainId={creditcoinTestnet.id}
                chainName="Creditcoin Testnet"
                address={state.gateAddress}
                abi={GATE_ABI}
                functionName="requestFinancing"
                args={[state.asset]}
                disabled={!isConnected || !valid}
                explorerBase={CC_TX}
                onConfirmed={refresh}
                danger
              />
            </section>
          </div>

          <section className="carbon-panel mt-6 p-6">
            <h2 className="font-display text-2xl text-bone">Prove a fact on Creditcoin</h2>
            <p className="mt-1 max-w-3xl text-sm text-ash">
              Pick a Sepolia transaction below. The proof is built from public data and shown
              before you sign; the gate re-verifies it on-chain, so a wrong proof simply reverts.
            </p>
            {sepoliaTxs.length === 0 && (
              <p className="mt-3 text-sm text-ash">No Sepolia transactions for this asset yet.</p>
            )}
            {sepoliaTxs.map((s) => (
              <div key={s.txHash} className="mt-3 border-t border-white/10 pt-3">
                <p className="font-mono text-xs break-all">
                  <a className="text-bullion-pale underline" href={s.explorer} target="_blank" rel="noopener noreferrer">
                    {s.txHash}
                  </a>{' '}
                  <span className="text-ash">({s.detail})</span>
                </p>
                <ProofSubmit
                  txHash={s.txHash!}
                  action={s.step === 'pledged' ? 1 : 0}
                  actionLabel={s.step === 'pledged' ? 'ENCUMBERED' : 'CLEAR'}
                  gateAddress={state.gateAddress}
                  onConfirmed={refresh}
                />
              </div>
            ))}
          </section>

          <section className="mt-6">
            <h2 className="font-display text-2xl text-bone">Chain history</h2>
            {state.steps.length === 0 && (
              <p className="mt-2 text-sm text-ash">Empty. No events on either chain.</p>
            )}
            {state.steps.map((s, i) => (
              <div key={`${s.txHash}-${i}`} className="ledger-row grid gap-1 md:grid-cols-[3rem_minmax(0,1fr)] md:gap-4">
                <span className="font-mono text-sm text-ash">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-sans font-semibold text-bone">{s.step}</p>
                    <p className="font-mono text-xs text-ash">{s.chain}</p>
                  </div>
                  <p className="mt-1 text-sm text-ash">{s.detail}</p>
                  {s.txHash && (
                    <a
                      href={s.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block font-mono text-xs text-bullion-pale underline break-all"
                    >
                      {s.txHash}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
