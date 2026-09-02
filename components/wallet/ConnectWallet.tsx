'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/Button'

export const ConnectWallet = () => {
    const { address, isConnected } = useAccount()
    const { connect, connectors, error, isPending } = useConnect()
    const { disconnect } = useDisconnect()
    const [showOptions, setShowOptions] = useState(false)

    if (isConnected) {
        return (
            <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
            </Button>
        )
    }

    return (
        <div className="relative">
            <Button
                variant="primary"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                isLoading={isPending}
            >
                Connect Wallet
            </Button>

            {showOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-card-hover border border-gray-200 p-2 z-50">
                    <h3 className="text-sm font-semibold text-brand-primary px-3 py-2">
                        Select Wallet
                    </h3>
                    {connectors.map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => {
                                connect({ connector })
                                setShowOptions(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-sm font-medium text-brand-primary">
                                {connector.name}
                            </span>
                        </button>
                    ))}
                    {error && (
                        <p className="text-xs text-red-600 px-3 py-2">
                            {error.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}