'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AssetState } from './types'
import { isValidAssetId } from './types'

/**
 * Live chain read for one asset id. Auto-loads whenever the id becomes
 * valid; `refresh()` re-reads after a confirmed write.
 */
export function useAssetState(assetId: string) {
  const [state, setState] = useState<AssetState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    if (!isValidAssetId(assetId)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gate/asset?assetId=${assetId}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'load failed')
      setState(body as AssetState)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [assetId, refreshKey])

  useEffect(() => {
    setState(null)
    setError(null)
    if (isValidAssetId(assetId)) void load()
  }, [assetId, load])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { state, error, loading, refresh }
}
