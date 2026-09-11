'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { isValidAssetId } from '@/components/gate/types'
import { BorrowFlow } from '@/components/gate/BorrowFlow'
import { VerdictPanel } from '@/components/gate/VerdictPanel'
import { ChainHistory } from '@/components/gate/ChainHistory'
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
    <div className="container-custom max-w-3xl py-12">
      <p className="font-mono text-sm text-ash">Creditcoin · financing decision</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-bone md:text-5xl">
        Can this asset borrow?
      </h1>
      <p className="mt-4 max-w-xl text-ash">
        Borrowing pulls the asset&apos;s newest Sepolia fact, proves it through
        Attestcoin, and submits the proof with the financing request. Creditcoin
        verifies inline and enforces the outcome.
      </p>

      {loading && !state && <p className="mt-6 text-sm text-ash">Reading Creditcoin verdict…</p>}
      {error && !state && <p className="mt-6 text-sm text-block">{error}</p>}

      {state && (
        <>
          <VerdictPanel state={state} />
          <BorrowFlow state={state} isConnected={isConnected} onConfirmed={refresh} />
          <ChainHistory steps={state.steps} />
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
