import Link from 'next/link'

const linkCls =
  'font-sans font-semibold text-bullion-pale transition-colors hover:text-bone'

export default function HomePage() {
  return (
    <div>
      <section className="carbon-sheen">
        <div className="container-custom rise-in py-16 text-center md:py-24">
          <p className="font-mono text-sm text-ash">Creditcoin · Attestcoin · Sepolia</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-5xl leading-[1.05] text-bone md:text-7xl">
            Pledged somewhere else? Then it doesn&apos;t get financed here.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-sans text-lg leading-relaxed text-ash">
            CredLock checks the asset&apos;s foreign-chain record through Attestcoin before
            Creditcoin lends against it. Clear means go. Encumbered means the
            financing transaction itself refuses, no matter who clicks the button.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <Link href="/verify" className={linkCls}>
              Inspect the gate <span aria-hidden>→</span>
            </Link>
            <Link href="#rule" className={linkCls}>
              Read the rule <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="group carbon-panel border-white/10 p-5 transition-colors hover:border-allow/70">
              <span className="verdict-stamp border-white/20 font-mono text-ash transition-colors group-hover:border-allow group-hover:text-allow">
                ALLOW
              </span>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                Attestcoin proves the asset is clear on the source chain. Financing may execute.
              </p>
            </div>
            <div className="group carbon-panel border-white/10 p-5 transition-colors hover:border-block/70">
              <span className="verdict-stamp border-white/20 font-mono text-ash transition-colors group-hover:border-block group-hover:text-block">
                DENY
              </span>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                Attestcoin proves it is already pledged or financed. Financing reverts on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="rule" className="bg-carbon-850/50">
        <div className="container-custom py-14">
          <h2 className="max-w-2xl font-display text-3xl text-bone md:text-4xl">One rule, enforced by the contract</h2>
          <div className="mt-6">
            {[
              ['A financing request names an asset.', 'One RWA identifier, deterministic across chains.'],
              ['CredLock pulls the foreign-chain fact.', 'Is this asset already pledged, financed, or encumbered on Sepolia?'],
              ['Attestcoin proves the answer.', 'A Merkle inclusion proof plus continuity proof, verified by the on-chain precompile, not a backend claim.'],
              ['The gate writes ALLOW or BLOCK.', 'A machine-checkable verdict stored on Creditcoin.'],
              ['Financing reads the verdict.', 'ALLOW executes. BLOCK reverts with AssetEncumbered. Nothing in between can change that.'],
            ].map(([title, body]) => (
              <div key={title} className="ledger-row grid gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
                <p className="font-sans font-semibold text-bone">{title}</p>
                <p className="text-ash">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-custom py-14 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl text-bone md:text-4xl">Nothing to take on trust</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ash">
            Every step leaves an inspectable record: the Sepolia transaction, the proof
            you can re-derive from the public builder, the Creditcoin verification
            transaction, and the final outcome. Run the same asset twice:
            first clean, then pledged, and the second financing visibly fails.
          </p>
          <Link href="/verify" className={`${linkCls} mt-6 inline-block`}>
            Open the gate console <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
