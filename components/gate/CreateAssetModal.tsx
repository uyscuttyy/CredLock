'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { sepolia } from '@/lib/credlock/chains'
import { REGISTRY_ABI, SEPOLIA_TX } from './contracts'
import { nameToAssetId } from './assetId'
import { isValidAssetId } from './types'
import { TxAction } from './TxAction'

/**
 * Creation modal: name in, live hash out with copy, Sepolia register inline.
 * Never overwrites what the user typed; the hash is derived, not random.
 */
export function CreateAssetModal({
  open,
  onClose,
  registryAddress,
  onRegistered,
}: {
  open: boolean
  onClose: () => void
  registryAddress: string
  onRegistered: (assetId: string) => void
}) {
  const { isConnected } = useAccount()
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [alreadyListed, setAlreadyListed] = useState<boolean | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setCopied(false)
      setAlreadyListed(null)
    }
  }, [open ])

  const assetId = nameToAssetId(name)
  const showHash = name.trim() !== '' && isValidAssetId(assetId)

  // Pre-check: the same name always yields the same id, so registering twice
  // reverts on-chain (and wallets surface that as a bogus gas estimate).
  // Check first and never offer a doomed signature.
  useEffect(() => {
    if (!showHash) {
      setAlreadyListed(null)
      return
    }
    let live = true
    setAlreadyListed(null)
    fetch(`/api/gate/asset?assetId=${assetId}`)
      .then((r) => r.json())
      .then((b) => {
        if (!live) return
        setAlreadyListed(
          b.owner !== undefined && b.owner !== '0x0000000000000000000000000000000000000000',
        )
      })
      .catch(() => {
        if (live) setAlreadyListed(null)
      })
    return () => {
      live = false
    }
  }, [assetId, showHash])

  async function copy() {
    try {
      await navigator.clipboard.writeText(assetId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-carbon-950/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create a new asset"
    >
      <div
        className="carbon-panel w-full max-w-lg p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-bone">New asset</h2>
            <p className="mt-1 text-sm text-ash">
              Name it. The id is derived from the name, same name gives the same id everywhere.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-ash hover:text-bone"
          >
            ✕
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-bone" htmlFor="new-asset-name">
          Asset name
        </label>
        <input
          id="new-asset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. warehouse-lagos-04"
          spellCheck={false}
          autoFocus
          className="field-dark mt-2 w-full"
        />

        {showHash && (
          <div className="mt-4 rounded-lg border border-white/10 bg-carbon-950/60 p-3">
            <p className="font-mono text-xs text-ash">On-chain id</p>
            <p className="mt-1 font-mono text-sm text-bullion-pale break-all">{assetId}</p>
            <button
              onClick={copy}
              className="mt-2 text-sm font-semibold text-bullion-pale hover:text-bone"
            >
              {copied ? 'Copied ✓' : 'Copy id →'}
            </button>
          </div>
        )}

        {showHash && (
          <div className="mt-4">
            <p className="text-sm text-ash">List it on Sepolia straight from here. Your wallet signs.</p>
            {alreadyListed === true ? (
              <p className="mt-3 rounded-lg border border-bullion/40 bg-bullion/10 p-4 text-sm font-semibold text-bone">
                Already listed on Sepolia. Registering again would revert; check it on
                the verify page instead.
              </p>
            ) : (
              <TxAction
                label="List asset on Sepolia (CLEAR fact)"
                chainId={sepolia.id}
                chainName="Sepolia"
                address={registryAddress}
                abi={REGISTRY_ABI}
                functionName="registerAsset"
                args={[assetId]}
                disabled={!isConnected}
                explorerBase={SEPOLIA_TX}
                onConfirmed={() => {
                  onRegistered(assetId)
                  onClose()
                }}
              />
            )}
            {!isConnected && (
              <p className="mt-2 text-sm text-ash">Connect your wallet (top right) to sign.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
