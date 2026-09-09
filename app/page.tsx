import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      <section className="carbon-sheen border-b border-white/10">
        <div className="container-custom rise-in py-16 md:py-24">
          <p className="font-mono text-sm text-ash">Creditcoin · Attestcoin · Sepolia</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.05] text-bone md:text-7xl">
            Pledged somewhere else? Then it doesn&apos;t get financed here.
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-lg leading-relaxed text-ash">
            CredLock checks the asset&apos;s foreign-chain record through Attestcoin before
            Creditcoin lends against it. Clear means go. Encumbered means the
            financing transaction itself refuses — no matter who clicks the button.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/gate"
              className="rounded-lg bg-bullion px-7 py-3 font-sans font-semibold text-carbon-950 hover:bg-bullion-pale"
            >
              Inspect the gate
            </Link>
            <Link
              href="#rule"
              className="rounded-lg border border-white/20 px-7 py-3 font-sans font-semibold text-bone hover:border-bullion/70 hover:text-bullion-pale"
            >
              Read the rule
            </Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
            <div className="carbon-panel border-0 border-l-4 border-l-allow !rounded-none p-6 md:p-8">
              <span className="verdict-stamp border-allow font-mono text-allow">ALLOW</span>
              <p className="mt-3 max-w-md text-ash">
                Attestcoin proves the asset is clear on the source chain. Financing may execute.
              </p>
            </div>
            <div className="carbon-panel border-0 border-l-4 border-l-block !rounded-none p-6 md:p-8">
              <span className="verdict-stamp border-block font-mono text-block">BLOCK</span>
              <p className="mt-3 max-w-md text-ash">
                Attestcoin proves it is already pledged or financed. Financing reverts on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="rule" className="border-b border-white/10">
        <div className="container-custom py-14">
          <h2 className="max-w-2xl font-display text-3xl text-bone md:text-4xl">One rule, enforced by the contract</h2>
          <div className="mt-6">
            {[
              ['A financing request names an asset.', 'One RWA identifier, deterministic across chains.'],
              ['CredLock pulls the foreign-chain fact.', 'Is this asset already pledged, financed, or encumbered on Sepolia?'],
              ['Attestcoin proves the answer.', 'A Merkle inclusion proof plus continuity proof, verified by the on-chain precompile — not a backend claim.'],
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
        <div className="container-custom py-14">
          <h2 className="max-w-2xl font-display text-3xl text-bone md:text-4xl">Nothing to take on trust</h2>
          <p className="mt-4 max-w-2xl text-ash">
            Every step leaves an inspectable record: the Sepolia transaction, the proof
            you can re-derive from the public builder, the Creditcoin verification
            transaction, and the final outcome. Run the same asset twice —
            first clean, then pledged — and the second financing visibly fails.
          </p>
          <Link
            href="/gate"
            className="mt-6 inline-block rounded-lg bg-bullion px-7 py-3 font-sans font-semibold text-carbon-950 hover:bg-bullion-pale"
          >
            Open the gate console
          </Link>
        </div>
      </section>
    </div>
  )
}
