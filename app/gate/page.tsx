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

function Stamp({ value }: { value: string }) {
  const allow = value === 'ALLOW' || value === 'SUCCESS'
  const blocked = value === 'BLOCK' || value === 'REVERTED'
  const cls = allow
    ? 'border-brand-accent text-brand-accent'
    : blocked
      ? 'border-brand-alarm text-brand-alarm'
      : 'border-brand-muted text-brand-muted'
  return <span className={`verdict-stamp ${cls}`}>{value}</span>
}

function StepRow({ index, s }: { index: number; s: Step }) {
  return (
    <div className="ledger-row grid gap-1 md:grid-cols-[3rem_minmax(0,1fr)] md:gap-4">
      <span className="font-mono text-sm text-brand-muted">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">{s.step}</p>
          <p className="font-mono text-xs text-brand-muted">{s.chain}</p>
        </div>
        <p className="mt-1 text-sm text-brand-muted">{s.detail}</p>
        {s.txHash && (
          <a
            href={txLink(s.chain, s.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-mono text-xs text-brand-accent underline break-all"
          >
            {s.txHash}
          </a>
        )}
      </div>
    </div>
  )
}

function Attempt({
  title,
  summary,
  steps,
  tone,
}: {
  title: string
  summary: { fact: string; verdict: string; financing: string }
  steps: Step[]
  tone: 'allow' | 'block'
}) {
  const border = tone === 'allow' ? 'border-brand-accent' : 'border-brand-alarm'
  return (
    <section className={`rounded-lg border-2 ${border} bg-white p-6`}>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <Stamp value={summary.fact} />
        <Stamp value={summary.verdict} />
        <Stamp value={summary.financing} />
      </div>
      <div className="mt-4">
        {steps.map((s, i) => (
          <StepRow key={s.step} index={i} s={s} />
        ))}
      </div>
    </section>
  )
}

const ATTEMPT1_STEPS = ['register', 'attest-clear', 'execute-clear', 'financing-attempt-1']
const ATTEMPT2_STEPS = ['pledge', 'attest-encumbered', 'execute-encumbered', 'financing-attempt-2']

export default function GatePage() {
  const [assetId, setAssetId] = useState('')
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [live, setLive] = useState<LiveVerdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    const id = assetId.trim()
    if (!/^0x[0-9a-fA-F]{64}$/.test(id)) {
      setError('Paste a 0x asset id exactly as printed by the demo script.')
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
        throw new Error((body as { error?: string }).error ?? 'No recorded demo for this asset yet.')
      }
      setEvidence((await evRes.json()) as Evidence)
      if (liveRes.ok) setLive((await liveRes.json()) as LiveVerdict)
      else setLive(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed.')
      setEvidence(null)
      setLive(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-12">
      <p className="font-mono text-sm text-brand-muted">The gate, inspected</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
        Same asset. Two attempts. One refusal.
      </h1>
      <p className="mt-4 max-w-2xl text-brand-muted">
        Paste the asset id from a demo run. You get the full chain — the Sepolia
        fact, the Attestcoin proof, the on-chain verification, the verdict, and
        the financing outcome — plus a live read of the gate itself.
      </p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <input
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="0x asset id"
          spellCheck={false}
          className="flex-1 rounded-md border border-brand-hairline bg-white px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-md bg-brand-primary px-6 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Reading…' : 'Open the record'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-brand-alarm">{error}</p>}

      {!evidence && !error && (
        <div className="mt-10 rounded-lg border border-dashed border-brand-hairline p-8 text-brand-muted">
          <p className="font-display text-xl font-bold text-brand-primary">No record open</p>
          <p className="mt-2 max-w-xl text-sm">
            Run the demo once with real deployments and the two attempts appear here:
            the clean financing that succeeds, and the pledged one the contract
            refuses. Until then, this page is an empty ledger waiting for entries.
          </p>
          <p className="mt-3 font-mono text-xs">npm run demo [asset-name]</p>
        </div>
      )}

      {live && (
        <section className="mt-10 rounded-lg bg-brand-primary p-6 text-white md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs opacity-70">Live on-chain verdict · read just now</p>
              <p className="mt-1 font-mono text-sm break-all">{live.asset}</p>
            </div>
            <Stamp value={live.verdict} />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="opacity-70">Reason</dt><dd className="mt-1 font-mono">{live.reason}</dd></div>
            <div><dt className="opacity-70">Financed</dt><dd className="mt-1 font-mono">{String(live.financed)}</dd></div>
            <div><dt className="opacity-70">Verification</dt><dd className="mt-1 font-mono">{live.verificationStatus}</dd></div>
            <div>
              <dt className="opacity-70">Gate contract</dt>
              <dd className="mt-1">
                <a className="font-mono text-xs underline break-all" href={live.explorer} target="_blank" rel="noopener noreferrer">
                  {live.gateAddress}
                </a>
              </dd>
            </div>
          </dl>
        </section>
      )}

      {evidence && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Attempt
            title="Attempt 1 — clean"
            summary={evidence.attempt1}
            steps={evidence.steps.filter((s) => ATTEMPT1_STEPS.includes(s.step))}
            tone="allow"
          />
          <Attempt
            title="Attempt 2 — pledged"
            summary={evidence.attempt2}
            steps={evidence.steps.filter((s) => ATTEMPT2_STEPS.includes(s.step))}
            tone="block"
          />
        </div>
      )}

      {evidence && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Check it yourself</h2>
          <div className="mt-4">
            {[
              ['Open each transaction in its explorer and confirm the events it claims.', 'AssetRegistered and AssetPledged on Sepolia; VerdictRecorded and FinancingExecuted on Creditcoin.'],
              ['Re-derive the Attestcoin proof from the public builder.', 'GET prover.cc3-testnet.creditcoin.network/api/v1/proof-by-tx/1/<sepolia-tx> — no key, no permission.'],
              ['Read the gate contract directly.', `Call verdictOf(${evidence.assetId}) at ${evidence.gateAddress} on chain 102031.`],
              ['Try to finance it yourself.', `Call requestFinancing with the same id. It reverts with AssetEncumbered — this page cannot change that.`],
            ].map(([title, body]) => (
              <div key={title} className="ledger-row grid gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
                <p className="font-semibold">{title}</p>
                <p className="font-mono text-sm text-brand-muted break-all">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs text-brand-muted">
            Recorded {evidence.ranAt} · gate {evidence.gateAddress} · registry {evidence.registryAddress}
          </p>
        </section>
      )}
    </div>
  )
}
