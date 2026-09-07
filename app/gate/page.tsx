'use client'

import { useState } from 'react'

interface Step {
  step: string
  chain: string
  txHash?: string
  detail: string
}

interface Evidence {
  assetName: string
  assetId: string
  sourceChain: string
  sourceChainKey: number
  gateAddress: string
  registryAddress: string
  attempt1: { fact: string; verdict: string; financing: string }
  attempt2: { fact: string; verdict: string; financing: string }
  steps: Step[]
  ranAt: string
}

interface LiveVerdict {
  asset: string
  verdict: string
  reason: string
  financed: boolean
  verificationStatus: string
  gateAddress: string
  registryAddress: string
  explorer: string
}

function txLink(chain: string, hash: string): string {
  if (chain.includes('Sepolia') || chain.includes('Attestcoin')) {
    return `https://sepolia.etherscan.io/tx/${hash}`
  }
  return `https://creditcoin-testnet.blockscout.com/tx/${hash}`
}

function StepRow({ s }: { s: Step }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-brand-primary">{s.step}</span>
        <span className="text-xs text-brand-muted">{s.chain}</span>
      </div>
      <p className="text-sm text-gray-700">{s.detail}</p>
      {s.txHash && (
        <a
          href={txLink(s.chain, s.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-brand-accent underline break-all"
        >
          {s.txHash}
        </a>
      )}
    </div>
  )
}

export default function GatePage() {
  const [assetId, setAssetId] = useState('')
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [live, setLive] = useState<LiveVerdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    const id = assetId.trim()
    if (!/^0x[0-9a-fA-F]{64}$/.test(id)) {
      setError('Paste a 0x-prefixed bytes32 asset id (as printed by the demo script).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [evRes, liveRes] = await Promise.all([
        fetch(`/api/gate/evidence?assetId=${id}`),
        fetch(`/api/gate/verdict?assetId=${id}`),
      ])
      if (!evRes.ok) {
        const body = await evRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'evidence not found')
      }
      setEvidence((await evRes.json()) as Evidence)
      if (liveRes.ok) setLive((await liveRes.json()) as LiveVerdict)
      else setLive(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
      setEvidence(null)
      setLive(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-10">
      <h1 className="text-3xl font-bold text-brand-primary">CredLock verification gate</h1>
      <p className="mt-2 max-w-3xl text-brand-muted">
        Before Creditcoin lends against an RWA, CredLock forces a cryptographic clear/encumbered
        result from the source chain. Double-pledging becomes a blocked state transition — enforced
        by the financing contract, not by this UI.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="0x asset id from demo-evidence"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-brand-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Inspect proof chain'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {live && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-brand-primary">Live on-chain verdict</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-brand-muted">Verdict</dt><dd className="font-mono font-bold">{live.verdict}</dd></div>
            <div><dt className="text-brand-muted">Reason</dt><dd className="font-mono">{live.reason}</dd></div>
            <div><dt className="text-brand-muted">Financed</dt><dd className="font-mono">{String(live.financed)}</dd></div>
            <div><dt className="text-brand-muted">Verification</dt><dd className="font-mono">{live.verificationStatus}</dd></div>
            <div className="col-span-2"><dt className="text-brand-muted">Gate</dt><dd><a className="font-mono text-xs text-brand-accent underline break-all" href={live.explorer} target="_blank" rel="noopener noreferrer">{live.gateAddress}</a></dd></div>
          </dl>
        </div>
      )}

      {evidence && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
            <h2 className="text-lg font-bold text-green-800">Attempt 1 — {evidence.attempt1.fact} → {evidence.attempt1.verdict} → financing {evidence.attempt1.financing}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {evidence.steps.filter((s) => ['register', 'attest-clear', 'execute-clear', 'financing-attempt-1'].includes(s.step)).map((s) => (
                <StepRow key={s.step} s={s} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <h2 className="text-lg font-bold text-red-800">Attempt 2 — {evidence.attempt2.fact} → {evidence.attempt2.verdict} → financing {evidence.attempt2.financing}</h2>
            <p className="mt-1 text-sm text-red-700">Same asset, after pledging on {evidence.sourceChain}.</p>
            <div className="mt-3 flex flex-col gap-2">
              {evidence.steps.filter((s) => ['pledge', 'attest-encumbered', 'execute-encumbered', 'financing-attempt-2'].includes(s.step)).map((s) => (
                <StepRow key={s.step} s={s} />
              ))}
            </div>
          </div>
        </div>
      )}

      {evidence && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <h2 className="font-semibold text-brand-primary">How to verify this yourself</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Open each transaction hash above in its explorer and confirm the events (<code>AssetRegistered</code> / <code>AssetPledged</code> on Sepolia; <code>VerdictRecorded</code> / <code>FinancingExecuted</code> on Creditcoin).</li>
            <li>Re-derive the Attestcoin proof: <code>GET https://prover.cc3-testnet.creditcoin.network/api/v1/proof-by-tx/1/&lt;sepolia-tx&gt;</code>.</li>
            <li>Read the gate directly: <code>verdictOf({evidence.assetId})</code> at <code>{evidence.gateAddress}</code> on Creditcoin testnet (chain 102031).</li>
            <li>Try calling <code>requestFinancing({evidence.assetId})</code> yourself — it reverts with <code>AssetEncumbered</code>. No UI or backend can override that.</li>
          </ol>
          <p className="mt-2 text-xs text-brand-muted">Recorded {evidence.ranAt} · gate {evidence.gateAddress} · registry {evidence.registryAddress}</p>
        </div>
      )}
    </div>
  )
}
