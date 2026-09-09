'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { sepolia } from '@/lib/credlock/chains'
import { REGISTRY_ABI, SEPOLIA_TX } from '@/components/gate/contracts'
import { nameToAssetId } from '@/components/gate/assetId'
import { TxAction } from '@/components/gate/TxAction'
import { ProofSubmit } from '@/components/gate/ProofSubmit'
import { VerdictPanel } from '@/components/gate/VerdictPanel'
import { ChainHistory } from '@/components/gate/ChainHistory'
import { CreateAssetModal } from '@/components/gate/CreateAssetModal'
import { useAssetState } from '@/components/gate/useAssetState'

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="container-custom py-12 text-ash">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  )
}

function VerifyInner() {
  const params = useSearchParams()
  const { isConnected } = useAccount()
  const [input, setInput] = useState(params.get('assetId') ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const [registryAddress, setRegistryAddress] = useState('')

  const assetId = nameToAssetId(input)
  const { state, error, loading, refresh } = useAssetState(assetId)

  useEffect(() => {
    fetch('/api/gate/config')
      .then((r) => r.json())
      .then((b) => {
        if (b.registryAddress) setRegistryAddress(b.registryAddress as string)
      })
      .catch(() => {})
  }, [])

  const sepoliaTxs = (state?.steps ?? []).filter(
    (s) => s.chain.includes('Sepolia') && s.txHash && (s.step === 'registered' || s.step === 'pledged'),
  )

  return (
    <div className="container-custom py-12">
      <p className="font-mono text-sm text-ash">Creditcoin · Attestcoin · Sepolia</p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-bone md:text-5xl">
        Verify an asset before it borrows.
      </h1>
      <p className="mt-4 max-w-3xl text-ash">
        Create the asset on Sepolia, check its live record, and prove the fact on
        Creditcoin. Every write below is signed by your wallet. Nothing here is
        preloaded; every outcome is read live from chain state.
      </p>

      <section className="carbon-panel mt-8 p-6">
        <h2 className="font-display text-2xl text-bone">1. Create the asset</h2>
        <p className="mt-1 max-w-2xl text-sm text-ash">
          Name it, see its on-chain id update as you type, copy it, and list it on
          Sepolia without leaving the popup.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-4 rounded-lg bg-bullion px-6 py-2 text-sm font-semibold text-carbon-950 hover:bg-bullion-pale"
        >
          New asset
        </button>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-bone">2. Check it on chain</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Asset name or 0x id"
            spellCheck={false}
            className="field-dark flex-1"
          />
        </div>
        {input.trim() !== '' && (
          <p className="mt-2 font-mono text-xs text-ash break-all">
            {assetId !== '' && assetId !== input.trim() ? (
              <>“{input.trim()}” hashes to <span className="text-bullion-pale">{assetId}</span></>
            ) : (
              <>Using pasted id <span className="text-bullion-pale">{assetId}</span></>
            )}
          </p>
        )}
        {loading && <p className="mt-3 text-sm text-ash">Reading chain…</p>}
        {error && <p className="mt-3 text-sm text-block">{error}</p>}
      </section>

      {state && (
        <>
          <VerdictPanel state={state} />

          {state.verdict === 'NONE' && state.steps.length === 0 && (
            <p className="mt-6 rounded-lg border border-dashed border-white/15 p-6 text-ash">
              No on-chain record for this asset. That is the honest answer for unknown ids.
              Create it above or register it below.
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
                disabled={!isConnected}
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
                disabled={!isConnected}
                explorerBase={SEPOLIA_TX}
                onConfirmed={refresh}
                danger
              />
            </section>

            <section className="carbon-panel p-6">
              <h2 className="font-display text-2xl text-bone">Prove a fact on Creditcoin</h2>
              <p className="mt-1 text-sm text-ash">
                Pick a Sepolia transaction. The proof is built from public data and shown
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
          </div>

          <ChainHistory steps={state.steps} />

          <div className="mt-8 text-center">
            <Link
              href={`/finance?assetId=${state.asset}`}
              className="font-sans font-semibold text-bullion-pale transition-colors hover:text-bone"
            >
              Continue to financing <span aria-hidden>→</span>
            </Link>
          </div>
        </>
      )}

      <CreateAssetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        registryAddress={registryAddress}
        onRegistered={(id) => setInput(id)}
      />
    </div>
  )
}
