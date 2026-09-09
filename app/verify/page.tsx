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
  const registered =
    sepoliaTxs.some((s) => s.step === 'registered') ||
    (state !== null && state.owner !== '0x0000000000000000000000000000000000000000')

  return (
    <div>
      <section className="carbon-sheen">
        <div className="container-custom max-w-3xl py-14 text-center md:py-20">
          <p className="font-mono text-sm text-ash">Creditcoin · Attestcoin · Sepolia</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-bone md:text-5xl">
            Verify an asset before it borrows.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ash">
            Create the asset on Sepolia, check its live record, and prove the fact on
            Creditcoin. Every write below is signed by your wallet. Nothing here is
            preloaded; every outcome is read live from chain state.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-8 rounded-lg bg-bullion px-8 py-2.5 text-sm font-semibold text-carbon-950 hover:bg-bullion-pale"
          >
            New asset
          </button>
        </div>
      </section>

      <section className="bg-carbon-850/50">
        <div className="container-custom max-w-3xl py-12">
          <p className="font-mono text-xs text-bullion-pale">Step 01 · Check it on chain</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Asset name or 0x id"
            spellCheck={false}
            className="field-dark mt-4 w-full"
          />
          {loading && <p className="mt-3 text-sm text-ash">Reading chain…</p>}
          {error && <p className="mt-3 text-sm text-block">{error}</p>}

          {state && (
            <>
              <VerdictPanel state={state} />

              {state.verdict === 'NONE' && state.steps.length === 0 && (
                <p className="mt-6 rounded-lg border border-dashed border-white/15 p-6 text-ash">
                  No on-chain record for this asset. That is the honest answer for unknown ids.
                  Create it above or register it below.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {state && (
        <section>
          <div className="container-custom max-w-3xl py-12">
            <p className="font-mono text-xs text-bullion-pale">Step 02 · Prove the fact</p>
            <h2 className="mt-1 font-display text-3xl text-bone">Source chain writes</h2>
            <p className="mt-2 max-w-xl text-sm text-ash">
              Register a clean asset or pledge an encumbered one. Signed by your wallet on Sepolia.
            </p>
            {state.pledged ? (
              <p className="mt-4 rounded-lg border border-block/40 bg-block/10 p-4 text-sm font-semibold text-bone">
                Already pledged on Sepolia. Nothing left to write here; prove the pledge below.
              </p>
            ) : registered ? (
              <div className="carbon-panel mt-4 p-5">
                <p className="text-sm text-ash">
                  Registered on Sepolia. Only step left here is pledging it, which records the ENCUMBERED fact.
                </p>
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
              </div>
            ) : (
              <div className="carbon-panel mt-4 p-5">
                <p className="text-sm text-ash">
                  Not on Sepolia yet. Register it now; your wallet signs once.
                </p>
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
              </div>
            )}

            <h2 className="mt-10 font-display text-3xl text-bone">Prove it on Creditcoin</h2>
            <p className="mt-2 max-w-xl text-sm text-ash">
              Each Sepolia transaction needs its own proof carried to Creditcoin. Only the
              newest fact decides the verdict, but every proof below is independently
              submittable: proving the registration records ALLOW, proving the pledge
              records BLOCK.
            </p>
            {sepoliaTxs.length === 0 && (
              <p className="mt-3 text-sm text-ash">No Sepolia transactions for this asset yet.</p>
            )}
            {sepoliaTxs.map((s, i) => (
              <div key={s.txHash} className="mt-3 border-t border-white/10 pt-3">
                <p className="font-mono text-xs break-all">
                  <a className="text-bullion-pale underline" href={s.explorer} target="_blank" rel="noopener noreferrer">
                    {s.txHash}
                  </a>{' '}
                  <span className="text-ash">({s.detail})</span>
                </p>
                <p className="mt-1 text-sm text-ash">
                  {i === sepoliaTxs.length - 1 && sepoliaTxs.length > 1 && (
                    <span className="font-semibold text-bone">Newest fact. </span>
                  )}
                  {s.step === 'pledged'
                    ? 'Submitting this records BLOCK: financing will revert.'
                    : 'Submitting this records ALLOW: financing may proceed.'}
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

            <ChainHistory steps={state.steps} />

            <div className="mt-10 text-center">
              <p className="font-mono text-xs text-bullion-pale">Step 03</p>
              <Link
                href={`/finance?assetId=${state.asset}`}
                className="mt-2 inline-block font-sans text-lg font-semibold text-bullion-pale transition-colors hover:text-bone"
              >
                Take this asset to financing <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
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
