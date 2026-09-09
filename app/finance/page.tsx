'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { creditcoinTestnet } from '@/lib/credlock/chains'
import { GATE_ABI, CC_TX } from '@/components/gate/contracts'
import { isValidAssetId } from '@/components/gate/types'
import { TxAction } from '@/components/gate/TxAction'
import { VerdictPanel } from '@/components/gate/VerdictPanel'
import { useAssetState } from '@/components/gate/useAssetState'

const linkCls = 'font-sans font-semibold text-bullion-pale transition-colors hover:text-bone'

function FinanceInner() {
  const params = useSearchParams()
  const raw = (params.get('assetId') ?? '').trim()
  const { isConnected } = useAccount()

  if (!isValidAssetId(raw)) {
    return (
      <div className="container-custom py-12 text-center">
        <h1 className="mx-auto max-w-2xl font-display text-4xl text-bone">No asset to finance.</h1>
        <p className="mx-auto mt-4 max-w-xl text-ash">
          Financing checks one asset at a time. Verify it first, then come back
          through the financing link with its record attached.
        </p>
        <Link href="/verify" className={`${linkCls} mt-6 inline-block`}>
          Go verify an asset <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  return <FinanceDecision assetId={raw} isConnected={isConnected} />
}

function FinanceDecision({ assetId, isConnected }: { assetId: string; isConnected: boolean }) {
  const { state, error, loading, refresh } = useAssetState(assetId)

  return (
    <div className="container-custom py-12">
      <p className="font-mono text-sm text-ash">Creditcoin · financing decision</p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-bone md:text-5xl">
        Can this asset borrow?
      </h1>

      {loading && !state && <p className="mt-6 text-sm text-ash">Reading Creditcoin verdict…</p>}
      {error && !state && <p className="mt-6 text-sm text-block">{error}</p>}

      {state && (
        <>
          <VerdictPanel state={state} />

          {state.verdict === 'ALLOW' && (
            <section className="carbon-panel mt-8 border-l-4 border-l-allow p-6">
              <h2 className="font-display text-2xl text-bone">Decision: may proceed</h2>
              <p className="mt-1 max-w-2xl text-sm text-ash">
                Attestcoin proved this asset is clear and the gate recorded ALLOW.
                Your wallet signs the borrow below; it will execute.
              </p>
              <TxAction
                label="Borrow against this asset"
                chainId={creditcoinTestnet.id}
                chainName="Creditcoin Testnet"
                address={state.gateAddress}
                abi={GATE_ABI}
                functionName="requestFinancing"
                args={[state.asset]}
                disabled={!isConnected}
                explorerBase={CC_TX}
                onConfirmed={refresh}
              />
            </section>
          )}

          {state.verdict === 'BLOCK' && (
            <section className="carbon-panel mt-8 border-l-4 border-l-block p-6">
              <h2 className="font-display text-2xl text-bone">Decision: will revert</h2>
              <p className="mt-1 max-w-2xl text-sm text-ash">
                Attestcoin proved this asset is already pledged or financed and the gate
                recorded BLOCK. You can still attempt the borrow and watch the contract
                refuse it; no one can make it succeed through this path.
              </p>
              <TxAction
                label="Attempt financing anyway (expect revert)"
                chainId={creditcoinTestnet.id}
                chainName="Creditcoin Testnet"
                address={state.gateAddress}
                abi={GATE_ABI}
                functionName="requestFinancing"
                args={[state.asset]}
                disabled={!isConnected}
                explorerBase={CC_TX}
                onConfirmed={refresh}
                danger
              />
            </section>
          )}

          {state.verdict === 'NONE' && (
            <section className="carbon-panel mt-8 border-l-4 border-l-bullion p-6">
              <h2 className="font-display text-2xl text-bone">Decision: nothing proven yet</h2>
              <p className="mt-1 max-w-2xl text-sm text-ash">
                No Creditcoin verdict exists for this asset, so financing cannot proceed.
                Prove its Sepolia fact first.
              </p>
              <Link href={`/verify?assetId=${state.asset}`} className={`${linkCls} mt-4 inline-block`}>
                Back to verify and prove <span aria-hidden>→</span>
              </Link>
            </section>
          )}

          {state.financed && (
            <p className="mt-6 rounded-lg border border-allow/40 bg-allow/10 p-4 text-sm font-semibold text-bone">
              This asset already borrowed successfully. Financing executed on Creditcoin.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="container-custom py-12 text-ash">Loading…</div>}>
      <FinanceInner />
    </Suspense>
  )
}
