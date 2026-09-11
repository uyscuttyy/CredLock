'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { creditcoinTestnet } from '@/lib/credlock/chains'
import { GATE_ABI, CC_TX } from './contracts'
import type { AssetState, Proof } from './types'
import { TxAction } from './TxAction'

/**
 * The Borrow action: fresh cross-chain evidence, Attestcoin proof, then the
 * financing transaction carrying that proof. Creditcoin verifies inline and
 * enforces the outcome. Every stage shown maps to a real operation.
 */
export function BorrowFlow({
  state,
  isConnected,
  onConfirmed,
}: {
  state: AssetState
  isConnected: boolean
  onConfirmed: () => void
}) {
  const [proof, setProof] = useState<Proof | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!building) return
    setElapsed(0)
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [building])

  const sepoliaTxs = state.steps.filter(
    (s) => s.chain.includes('Sepolia') && s.txHash && (s.step === 'registered' || s.step === 'pledged'),
  )
  const latest = sepoliaTxs.length > 0 ? sepoliaTxs[sepoliaTxs.length - 1] : null
  const encumbered = latest?.step === 'pledged'

  if (state.financed) {
    return (
      <p className="mt-6 rounded-lg border border-allow/40 bg-allow/10 p-4 text-sm font-semibold text-bone">
        This asset already borrowed successfully. Financing executed on Creditcoin.
      </p>
    )
  }

  if (!latest?.txHash) {
    return (
      <div className="carbon-panel mt-8 p-6">
        <h2 className="font-display text-2xl text-bone">Nothing to borrow against yet</h2>
        <p className="mt-1 max-w-2xl text-sm text-ash">
          This asset has no Sepolia record, so there is no collateral fact to prove.
          Register it first.
        </p>
        <Link
          href={`/verify?assetId=${state.asset}`}
          className="mt-4 inline-block font-sans font-semibold text-bullion-pale transition-colors hover:text-bone"
        >
          Go register it <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  async function build() {
    const ctl = new AbortController()
    abortRef.current = ctl
    setBuilding(true)
    setError(null)
    setProof(null)
    try {
      const res = await fetch(`/api/gate/proof?txHash=${latest!.txHash}`, { signal: ctl.signal })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'proof build failed')
      setProof(body as Proof)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('Stopped. Retry whenever ready; nothing was submitted.')
      } else {
        setError(e instanceof Error ? e.message : 'proof build failed')
      }
    } finally {
      setBuilding(false)
      abortRef.current = null
    }
  }

  function cancel() {
    abortRef.current?.abort()
  }

  return (
    <section className={`carbon-panel mt-8 border-l-4 p-6 ${encumbered ? 'border-l-block' : 'border-l-allow'}`}>
      <p className="font-mono text-xs text-ash">
        Current collateral fact · {latest.step} ·{' '}
        <a className="text-bullion-pale underline" href={latest.explorer} target="_blank" rel="noopener noreferrer">
          {latest.txHash.slice(0, 18)}…
        </a>
      </p>
      <h2 className="mt-1 font-display text-2xl text-bone">
        {encumbered ? 'This borrow will be blocked' : 'This borrow can proceed'}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-ash">
        {encumbered
          ? 'The newest Sepolia fact is a pledge. Borrowing builds a fresh proof of it and the contract refuses the financing on-chain.'
          : 'The newest Sepolia fact is a clean registration. Borrowing builds a fresh proof of it and the contract executes the financing on-chain.'}
      </p>

      {!proof ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={build}
              disabled={building || !isConnected}
              className="rounded-lg bg-bullion px-6 py-2 text-sm font-semibold text-carbon-950 hover:bg-bullion-pale disabled:opacity-50"
            >
              {building ? 'Waiting for attestation, then proving…' : 'Borrow'}
            </button>
            {building && (
              <button
                onClick={cancel}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-ash hover:text-bone"
              >
                Stop
              </button>
            )}
          </div>
          {building && (
            <p className="mt-2 font-mono text-xs text-ash">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed ·
              waiting for Creditcoin attestors to attest the Sepolia block, then building the proof.
            </p>
          )}
          {!isConnected && (
            <p className="mt-2 text-sm text-ash">Connect your wallet (top right) to borrow.</p>
          )}
          {error && <p className="mt-2 text-sm text-block">{error}</p>}
        </>
      ) : (
        <>
          <p className="mt-4 font-mono text-xs text-ash">
            Fresh proof · block {proof.headerNumber} · chainKey {proof.chainKey} ·
            siblings {proof.siblings.length} · roots {proof.continuityRoots.length}
          </p>
          <TxAction
            label={encumbered ? 'Sign borrow (expect on-chain revert)' : 'Sign borrow'}
            chainId={creditcoinTestnet.id}
            chainName="Creditcoin Testnet"
            address={state.gateAddress}
            abi={GATE_ABI}
            functionName="requestFinancingWithProof"
            args={[
              state.asset,
              proof.chainKey,
              proof.headerNumber,
              proof.txBytes,
              proof.merkleRoot,
              proof.siblings,
              proof.lowerEndpointDigest,
              proof.continuityRoots,
            ]}
            disabled={!isConnected}
            explorerBase={CC_TX}
            onConfirmed={() => {
              setProof(null)
              onConfirmed()
            }}
            danger={encumbered}
          />
        </>
      )}
    </section>
  )
}
