'use client'

import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Abi } from 'viem'

/**
 * One wallet-signed transaction on a specific chain. Handles chain switching,
 * receipt tracking, and revert display. Nothing here touches a server key.
 */
export function TxAction({
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
