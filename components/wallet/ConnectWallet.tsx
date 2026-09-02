'use client'

import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

export const ConnectWallet = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  
  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      // Find the injected connector (MetaMask, etc.)
      const injectedConnector = connectors.find(c => c.type === 'injected')
      
      if (injectedConnector) {
        await connect({ connector: injectedConnector })
      } else if (connectors.length > 0) {
        await connect({ connector: connectors[0] })
      } else {
        setError('No wallet found. Please install MetaMask or another Web3 wallet.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
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
        onClick={handleConnect}
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