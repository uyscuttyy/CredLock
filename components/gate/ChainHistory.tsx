'use client'

import type { AssetStep } from './types'

export function ChainHistory({ steps }: { steps: AssetStep[] }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl text-bone">Chain history</h2>
      {steps.length === 0 && (
        <p className="mt-2 text-sm text-ash">Empty. No events on either chain.</p>
      )}
      {steps.map((s, i) => (
        <div key={`${s.txHash}-${i}`} className="ledger-row grid gap-1 md:grid-cols-[3rem_minmax(0,1fr)] md:gap-4">
          <span className="font-mono text-sm text-ash">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-sans font-semibold text-bone">{s.step}</p>
              <p className="font-mono text-xs text-ash">{s.chain}</p>
            </div>
            <p className="mt-1 text-sm text-ash">{s.detail}</p>
            {s.txHash && (
              <a
                href={s.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-mono text-xs text-bullion-pale underline break-all"
              >
                {s.txHash}
              </a>
            )}
          </div>
        </div>
      ))}
    </section>
  )
}
