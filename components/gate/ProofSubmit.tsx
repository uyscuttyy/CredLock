'use client'

import { useState } from 'react'
import { creditcoinTestnet } from '@/lib/credlock/chains'
import { GATE_ABI, CC_TX } from './contracts'
import type { Proof } from './types'
import { TxAction } from './TxAction'

/** Build a public proof for one Sepolia tx, show it, then submit via wallet. */
export function ProofSubmit({
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
