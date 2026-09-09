'use client'

import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'

export const ConnectWallet = () => {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { connectAsync } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [picking, setPicking] = useState(false)

  const connectWith = async (connectorId?: string) => {
    setIsConnecting(true)
    setError(null)
    try {
      const target = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : (connectors.find((c) => /metamask/i.test(c.name)) ?? connectors[0])
      if (!target) {
        setError(
          'No wallet announced itself. Enable MetaMask for this site (click its extension icon), then retry.',
        )
        return
      }
      await connectAsync({ connector: target })
      setPicking(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet'
      if (/rejected|denied|cancelled|closed/i.test(msg)) {
        setError('Connection request was closed in the wallet. Hit Connect again to retry.')
      } else {
        setError(msg)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  if (mounted && isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ash hidden sm:block">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {!picking ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // several providers detected is the norm (MetaMask + Phantom + …):
            // prefer MetaMask silently, offer the list when it is ambiguous
            const mm = connectors.filter((c) => /metamask/i.test(c.name))
            if (connectors.length > 1 && mm.length !== 1) {
              setPicking(true)
            } else {
              void connectWith()
            }
          }}
          isLoading={isConnecting}
        >
          Connect Wallet
        </Button>
      ) : (
        <div className="absolute right-0 z-50 w-64 rounded-lg border border-white/10 bg-carbon-850 p-2 shadow-2xl">
          <p className="px-2 py-1 font-mono text-xs text-ash">Pick a wallet</p>
          {connectors.map((c) => (
            <button
              key={c.id}
              onClick={() => void connectWith(c.id)}
              disabled={isConnecting}
              className="block w-full rounded px-2 py-2 text-left font-sans text-sm text-bone hover:bg-white/5 disabled:opacity-50"
            >
              {c.name}
            </button>
          ))}
          {connectors.length === 0 && (
            <p className="px-2 py-1 text-xs text-ash">
              None announced. Enable MetaMask for this site and reopen this menu.
            </p>
          )}
          <button
            onClick={() => setPicking(false)}
            className="mt-1 block w-full rounded px-2 py-1 text-left text-xs text-ash hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="absolute right-0 mt-2 w-64 rounded-lg border border-block/40 bg-carbon-850 p-3 text-xs text-block">
          {error}
        </p>
      )}
    </div>
  )
}
