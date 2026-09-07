import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-brand-hairline">
        <div className="container-custom py-16 md:py-24">
          <p className="font-mono text-sm text-brand-muted">Creditcoin · Attestcoin · Sepolia</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Pledged somewhere else? Then it doesn&apos;t get financed here.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-muted">
            CredLock checks the asset&apos;s foreign-chain record through Attestcoin before
            Creditcoin lends against it. Clear means go. Encumbered means the
            financing transaction itself refuses — no matter who clicks the button.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/gate"
              className="rounded-md bg-brand-accent px-6 py-3 font-semibold text-white hover:bg-brand-secondary"
            >
              Inspect the gate
            </Link>
            <Link
              href="#rule"
              className="rounded-md border border-brand-primary px-6 py-3 font-semibold hover:bg-brand-primary hover:text-white"
            >
              Read the rule
            </Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-brand-hairline bg-brand-hairline sm:grid-cols-2">
            <div className="bg-white p-6">
              <span className="verdict-stamp border-brand-accent text-brand-accent">ALLOW</span>
              <p className="mt-3 text-brand-muted">
                Attestcoin proves the asset is clear on the source chain. Financing may execute.
              </p>
            </div>
            <div className="bg-white p-6">
              <span className="verdict-stamp border-brand-alarm text-brand-alarm">BLOCK</span>
              <p className="mt-3 text-brand-muted">
                Attestcoin proves it is already pledged or financed. Financing reverts on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="rule" className="border-b border-brand-hairline">
        <div className="container-custom py-14">
          <h2 className="font-display text-3xl font-bold">One rule, enforced by the contract</h2>
          <div className="mt-6">
            {[
              ['A financing request names an asset.', 'One RWA identifier, deterministic across chains.'],
              ['CredLock pulls the foreign-chain fact.', 'Is this asset already pledged, financed, or encumbered on Sepolia?'],
              ['Attestcoin proves the answer.', 'A Merkle inclusion proof plus continuity proof, verified by the on-chain precompile — not a backend claim.'],
              ['The gate writes ALLOW or BLOCK.', 'A machine-checkable verdict stored on Creditcoin.'],
              ['Financing reads the verdict.', 'ALLOW executes. BLOCK reverts with AssetEncumbered. Nothing in between can change that.'],
            ].map(([title, body]) => (
              <div key={title} className="ledger-row grid gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
                <p className="font-semibold">{title}</p>
                <p className="text-brand-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-custom py-14">
          <h2 className="font-display text-3xl font-bold">Nothing to take on trust</h2>
          <p className="mt-4 max-w-2xl text-brand-muted">
            Every step leaves an inspectable record: the Sepolia transaction, the proof
            you can re-derive from the public builder, the Creditcoin verification
            transaction, and the final outcome. The demo runs the same asset twice —
            first clean, then pledged — and the second financing visibly fails.
          </p>
          <Link
            href="/gate"
            className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-black"
          >
            See both attempts
          </Link>
        </div>
      </section>
    </div>
  )
}
