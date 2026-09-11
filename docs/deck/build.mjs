/**
 * CredLock hackathon deck builder. Source of truth: repo + on-chain state.
 * No invented txs, addresses, or claims. Rebuild: node docs/deck/build.mjs
 */
import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('docs/CredLock-deck.pdf')

const C = {
  bg: '#0B0D0E',
  panel: '#14181B',
  bone: '#F4F2EC',
  ash: '#9BA4A8',
  gold: '#E3A82B',
  green: '#34D399',
  red: '#F87171',
}
const W = 595.28 // A4 portrait
const M = 56

const LINKS = {
  repo: 'https://github.com/uyscuttyy/CredLock',
  gate: 'https://creditcoin-testnet.blockscout.com/address/0xF1028099d9CeE27b355159beCD111c8f9A409F67',
  registry: 'https://sepolia.etherscan.io/address/0xae543bb778df66774585b99d9135676bc5d99c2a',
  borrowA: 'https://creditcoin-testnet.blockscout.com/tx/0xab138a65bc019554e1bf5a161451ece5b977791df90c0e2610e8f7188fd16c7d',
  regA: 'https://sepolia.etherscan.io/tx/0x1f3fee534c5f757ebd70b979102d43ef01d6baea07a921ff59db72b3c6c1c6d4',
  pledgeB: 'https://sepolia.etherscan.io/tx/0xd0625d429caab95496629bde3c50c865ac9d4c04bc2e2881d7e39fcd2f23c107',
  prover: 'https://prover.cc3-testnet.creditcoin.network',
}

const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: M, right: M }, info: {
  Title: 'CredLock - Cross-chain collateral safety for Creditcoin financing',
  Author: 'CredLock',
} })
doc.pipe(fs.createWriteStream(OUT))

function bg() {
  doc.save()
  doc.rect(0, 0, W, 841.89).fill(C.bg)
  doc.restore()
}
function h1(t) { doc.fillColor(C.bone).font('Helvetica-Bold').fontSize(30).text(t); }
function sub(t) { doc.fillColor(C.ash).font('Helvetica').fontSize(12).text(t); }
function h2(t) { doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(11).text(t.toUpperCase()); }
function body(t, opts = {}) {
  doc.fillColor(opts.color || C.bone).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10.5)
  doc.text(t, { lineGap: 3, ...opts.textOpts })
}
function small(t, color = C.ash) {
  doc.fillColor(color).font('Helvetica').fontSize(8.5).text(t, { lineGap: 2 })
}
function mono(t, color = C.bone) {
  doc.fillColor(color).font('Courier').fontSize(8).text(t)
}
function gap(n = 10) { doc.moveDown(n / 12) }
function arrow() {
  const x = M
  doc.save()
  doc.fillColor(C.ash).font('Helvetica').fontSize(11).text('v', x, doc.y)
  doc.restore()
  doc.moveDown(0.2)
}
function badge(label, color) {
  const y = doc.y
  doc.save()
  doc.roundedRect(M, y, 190, 26, 4).fill(color)
  doc.fillColor('#0B0D0E').font('Helvetica-Bold').fontSize(11)
  doc.text(label, M, y + 7, { width: 190, align: 'center' })
  doc.restore()
  doc.y = y + 32
}
function linkLine(label, url) {
  const y = doc.y
  doc.fillColor(C.ash).font('Helvetica').fontSize(8.5).text(label + '  ', { continued: true })
  doc.fillColor(C.gold).font('Helvetica').fontSize(8.5).text(url, { link: url, underline: true })
  doc.moveDown(0.35)
}

// ---------------- PAGE 1 ----------------
bg()
small('CREDITCOIN BUIDL HACKATHON', C.gold)
gap(4)
doc.fillColor(C.bone).font('Helvetica-Bold').fontSize(44).text('CredLock')
sub('Cross-chain collateral safety for Creditcoin financing')
gap(8)
body('An asset can be pledged as collateral on one chain, then presented to Creditcoin for financing. The second lender cannot see the first pledge.')
gap(4)
body('CredLock checks the collateral state before Creditcoin lends. Clear means go. Pledged means the financing transaction itself refuses.', { bold: false })
gap(10)

h2('Pledged elsewhere')
gap(2)
body('Asset pledged on Sepolia')
arrow()
body('Attestcoin proves the fact')
arrow()
body('Creditcoin verifies the proof inside the Borrow transaction')
arrow()
badge('BLOCKED  -  AssetEncumbered', C.red)
gap(6)

h2('Clear')
gap(2)
body('Asset clear on Sepolia')
arrow()
body('Attestcoin proves the fact')
arrow()
body('Creditcoin verifies the proof inside the Borrow transaction')
arrow()
badge('ALLOWED  -  Financing executes', C.green)

// ---------------- PAGE 2 ----------------
doc.addPage(); bg()
h2('How it works')
gap(2)
h1('Borrow carries the proof.')
gap(4)
body('The proof is not displayed by the frontend and trusted. The Borrow transaction carries a fresh Attestcoin proof to the Creditcoin gate. The gate verifies it inline through the BlockProver precompile and derives the decision from the proven transaction itself.')
gap(8)
h2('Architecture')
gap(4)
const flow = [
  'Sepolia SourcePledgeRegistry  -  emits AssetRegistered / AssetPledged',
  'Collateral fact for one asset id',
  'Attestcoin  -  Merkle inclusion + continuity proof (usc-sdk)',
  'Creditcoin CredLockGate.requestFinancingWithProof',
]
for (const f of flow) { body(f); arrow() }
doc.fillColor(C.bone).font('Helvetica-Bold').fontSize(10.5).text('CLEAR  ->  FINANCE      |      PLEDGED  ->  BLOCK')
gap(8)
h2('Deployed configuration')
gap(2)
mono('Gate (Creditcoin 102031): 0xF1028099d9CeE27b355159beCD111c8f9A409F67')
mono('Registry (Sepolia):       0xae543bb778df66774585b99d9135676bc5d99c2a')
mono('Source chainKey: 1  |  Verifier precompile: 0x0000..0FD2')
gap(6)
h2('Built with')
gap(2)
body('Solidity + Foundry (20 contract tests, all green). @gluwa/usc-sdk proof builder. EvmV1Decoder event checks. Next.js + wagmi UI where every write is signed by the user wallet. No server key, no mocks on the verification path.')

// ---------------- PAGE 3 ----------------
doc.addPage(); bg()
h2('Proof it works')
gap(2)
h1('Two assets, two outcomes.')
gap(6)
h2('Scenario A  -  clear asset borrows')
gap(2)
body('Asset 0x6349...0ae9e3. Registered on Sepolia, never pledged. Borrow submitted the fresh registration proof inside the financing transaction. Verified on-chain, financing executed, verdict ALLOW, financed true.')
gap(2)
mono('Sepolia register: 0x1f3fee534c5f757ebd70b979102d43ef01d6baea07a921ff59db72b3c6c1c6d4')
mono('Creditcoin borrow: 0xab138a65bc019554e1bf5a161451ece5b977791df90c0e2610e8f7188fd16c7d (block 5470652)')
gap(8)
h2('Scenario B  -  pledged asset reverts')
gap(2)
body('Asset 0x8bfc...024d9 (uyscutty). Registered, then pledged on Sepolia. Borrow submitted the fresh pledge proof. The gate reverted with AssetEncumbered (selector 0x01d7f74f) on a live node call, and the forge suite covers the mined revert path. No financing possible through this gate.')
gap(2)
mono('Sepolia pledge:   0xd0625d429caab95496629bde3c50c865ac9d4c04bc2e2881d7e39fcd2f23c107 (block 11684010)')
mono('Revert reason:    AssetEncumbered(), proven live + 20/20 forge tests')
gap(8)
h2('Links')
gap(2)
linkLine('Repository', LINKS.repo)
linkLine('Gate contract (Blockscout)', LINKS.gate)
linkLine('Registry (Etherscan)', LINKS.registry)
linkLine('Borrow tx, scenario A', LINKS.borrowA)
linkLine('Register tx, scenario A', LINKS.regA)
linkLine('Pledge tx, scenario B', LINKS.pledgeB)
linkLine('Proof builder', LINKS.prover)
gap(2)
small('Live app runs locally from the repository (see README). No staging URL is claimed.')
doc.end()
console.log('wrote', OUT)
