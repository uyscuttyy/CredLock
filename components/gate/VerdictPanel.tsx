'use client'

import type { AssetState } from './types'
import { Stamp } from './Stamp'

export function VerdictPanel({ state }: { state: AssetState }) {
  return (
    <section className={`carbon-panel mt-8 border-l-4 p-6 md:p-8 ${state.verdict === 'BLOCK' ? 'border-l-block' : state.verdict === 'ALLOW' ? 'border-l-allow' : 'border-l-bullion'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ash">Live verdict · {state.verificationStatus}</p>
          <p className="mt-1 font-mono text-sm text-bone break-all">{state.asset}</p>
        </div>
        <Stamp value={state.verdict} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 font-sans text-sm text-bone sm:grid-cols-4">
        <div><dt className="text-ash">Reason</dt><dd className="mt-1 font-mono">{state.reason}</dd></div>
        <div><dt className="text-ash">Financed</dt><dd className="mt-1 font-mono">{String(state.financed)}</dd></div>
        <div><dt className="text-ash">Pledged (Sepolia)</dt><dd className="mt-1 font-mono">{String(state.pledged)}</dd></div>
        <div><dt className="text-ash">Owner</dt><dd className="mt-1 font-mono text-xs break-all">{state.owner}</dd></div>
      </dl>
    </section>
  )
}
