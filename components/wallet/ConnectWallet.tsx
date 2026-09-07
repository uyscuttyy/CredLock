'use client'

import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

export const ConnectWallet = () => {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // 1. wagmi connectors (EIP-6963 announced wallets + injected)
      const target =
        connectors.find((c) => c.type === 'injected') ?? connectors[0]
      if (target) {
        await connectAsync({ connector: target })
        return
      }
      // 2. raw fallback: talk to the injected provider directly so a click
      // can never die silently when connector discovery comes up empty
      const eth = (window as unknown as {
        ethereum?: { request: (args: { method: string }) => Promise<unknown> }
      }).ethereum
      if (typeof window !== 'undefined' && eth) {
        await eth.request({ method: 'eth_requestAccounts' })
        // wagmi picks up the accounts once the provider responds; if it
        // doesn't within a beat, say so instead of hanging
        await new Promise((r) => setTimeout(r, 1500))
        return
      }
      setError(
        'No wallet detected. Open this page on http://localhost:3010 (MetaMask does not inject on plain IP addresses), then install/enable MetaMask and retry.',
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet'
      // user closing the prompt is not an error worth alarming about
      if (/rejected|denied|cancelled/i.test(msg)) {
        setError('Connection request was closed in the wallet. Hit Connect again to retry.')
      } else {
        setError(msg)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-muted hidden sm:block">
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
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          void handleConnect()
        }}
        isLoading={isConnecting}
      >
        Connect Wallet
      </Button>

      {error && (
        <p className="absolute right-0 mt-2 text-xs text-red-600 bg-white p-3 rounded shadow-card w-64">
          {error}
        </p>
      )}
    </div>
  )
}
