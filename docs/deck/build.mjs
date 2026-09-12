/**
 * CredLock hackathon deck builder. Source of truth: repo + on-chain state.
 * No invented txs, addresses, or claims. Rebuild: node docs/deck/build.mjs
 */
import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('docs/CredLock-deck.pdf')

const C = {
  paper: '#FFFFFF',
  wash: '#F4F1E8',
  ink: '#000000',
  grey: '#333333',
  gold: '#9A7418',
  goldSoft: '#F1E3B8',
  green: '#0E7A4F',
  greenSoft: '#DDF2E6',
  red: '#B3372F',
  redSoft: '#F7DDD9',
}
const W = 595.28
const H = 841.89
const M = 64

const LINKS = {
  app: 'https://credlock-neon.vercel.app/',
  repo: 'https://github.com/uyscuttyy/CredLock',
  gate: 'https://creditcoin-testnet.blockscout.com/address/0xF1028099d9CeE27b355159beCD111c8f9A409F67',
  registry: 'https://sepolia.etherscan.io/address/0xae543bb778df66774585b99d9135676bc5d99c2a',
  borrowA: 'https://creditcoin-testnet.blockscout.com/tx/0xab138a65bc019554e1bf5a161451ece5b977791df90c0e2610e8f7188fd16c7d',
  regA: 'https://sepolia.etherscan.io/tx/0x1f3fee534c5f757ebd70b979102d43ef01d6baea07a921ff59db72b3c6c1c6d4',
  pledgeB: 'https://sepolia.etherscan.io/tx/0xd0625d429caab95496629bde3c50c865ac9d4c04bc2e2881d7e39fcd2f23c107',
  prover: 'https://prover.cc3-testnet.creditcoin.network',
}

const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: M, right: M }, info: {
  Title: 'CredLock - Cross-chain collateral safety for Creditcoin financing',
  Author: 'CredLock',
} })
doc.pipe(fs.createWriteStream(OUT))

function bg() {
  doc.save()
  doc.rect(0, 0, W, H).fill(C.paper)
  doc.rect(0, 0, W, 10).fill(C.gold)
  doc.restore()
}
function gap(n = 12) { doc.moveDown(n / 12) }
function eyebrow(t) { doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(10).text(t.toUpperCase()); }
function h1(t) { doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(32).text(t); }
function standfirst(t) { doc.fillColor(C.grey).font('Helvetica').fontSize(12).text(t, { lineGap: 3 }); }
function body(t) { doc.fillColor(C.ink).font('Helvetica').fontSize(10.5).text(t, { lineGap: 4 }); }
function small(t, color = C.grey) { doc.fillColor(color).font('Helvetica').fontSize(8.5).text(t, { lineGap: 2 }); }
function mono(t) { doc.fillColor(C.ink).font('Courier').fontSize(9.5).text(t, { lineGap: 3 }); }
function card(x, w, title, titleColor, lines, soft) {
  const y = doc.y
  doc.save()
  doc.roundedRect(x, y, w, 118, 6).fill(soft)
  doc.fillColor(titleColor).font('Helvetica-Bold').fontSize(11)
  doc.text(title, x + 12, y + 10, { width: w - 24 })
  doc.fillColor(C.ink).font('Helvetica').fontSize(9)
  doc.text(lines.join('\n'), x + 12, y + 32, { width: w - 24, lineGap: 3 })
  doc.restore()
  return y + 118
}
function addrRow(label, value) {
  doc.fillColor(C.grey).font('Helvetica-Bold').fontSize(10).text(label)
  doc.fillColor(C.ink).font('Courier-Bold').fontSize(10).text(value, { lineGap: 3, wordBreak: true })
  gap(6)
}
function txRow(label, value, extra = '') {
  doc.fillColor(C.grey).font('Helvetica-Bold').fontSize(10).text(label + (extra ? '  ' + extra : ''))
  doc.fillColor(C.ink).font('Courier-Bold').fontSize(10).text(value, { lineGap: 3, wordBreak: true })
  gap(6)
}
function linkRow(label, url) {
  const y = doc.y
  doc.fillColor(C.grey).font('Helvetica-Bold').fontSize(10).text(label)
  doc.fillColor(C.ink).font('Courier-Bold').fontSize(10).text(url, { link: url, underline: true, lineGap: 3, wordBreak: true })
  const h = doc.y - y + 8
  doc.link(M, y, W - M * 2, h, url)
  gap(10)
}

// ---------------- PAGE 1 ----------------
bg()
eyebrow('Creditcoin BUIDL hackathon')
gap(6)
h1('CredLock')
gap(2)
standfirst('Collateral safety for Creditcoin financing.')
gap(10)
body('An asset gets pledged as collateral on one chain, then shows up at Creditcoin asking for financing. The second lender cannot see the first pledge.')
gap(2)
body('CredLock checks before Creditcoin lends. Same pattern for RWA collateral: never finance what is already pledged elsewhere.')
gap(2)
body('Built for lenders and Creditcoin credit apps that need a gate before money moves.')
gap(20)

const colW = (W - M * 2 - 16) / 2
const y0 = doc.y
const yA = card(M, colW, 'Pledged  ->  BLOCKED', C.red, [
  'Pledged on Sepolia.',
  'Attestcoin proves it.',
  'Creditcoin verifies inside Borrow.',
  'Reverts: AssetEncumbered.',
], C.redSoft)
const yB = card(M + colW + 16, colW, 'Clear  ->  ALLOWED', C.green, [
  'Clear on Sepolia.',
  'Attestcoin proves it.',
  'Creditcoin verifies inside Borrow.',
  'Financing executes.',
], C.greenSoft)
doc.y = Math.max(yA, yB) + 40
body('One rule: the financing transaction carries its own proof, or it does not happen.')

// ---------------- PAGE 2 ----------------
doc.addPage(); bg()
eyebrow('How it works')
gap(6)
h1('Borrow carries the proof.')
gap(6)
standfirst('Not trusted from the frontend alone. The Borrow transaction brings a fresh Attestcoin proof to the gate. The gate verifies it inline and decides from the proven fact.')
gap(12)
const steps = [
  ['1  Sepolia registry', 'SourcePledgeRegistry emits AssetRegistered (clear) and AssetPledged (encumbered) for one asset id.'],
  ['2  Attestcoin proof', 'Merkle inclusion plus continuity proof for the newest fact, built with the usc-sdk proof builder.'],
  ['3  Creditcoin gate', 'requestFinancingWithProof verifies through the BlockProver precompile (0xFD2) and checks the trusted emitter, chain, and event.'],
  ['4  Decision', 'Clear fact: records ALLOW, executes financing. Pledged fact: reverts AssetEncumbered. A recorded BLOCK can never reopen.'],
]
for (const [t, d] of steps) {
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(11).text(t)
  doc.fillColor(C.grey).font('Helvetica').fontSize(10).text(d, { lineGap: 3 })
  gap(16)
}
eyebrow('Deployed now')
gap(4)
addrRow('Gate  -  Creditcoin 102031', '0xF1028099d9CeE27b355159beCD111c8f9A409F67')
addrRow('Registry  -  Sepolia', '0xae543bb778df66774585b99d9135676bc5d99c2a')
body('Source chainKey 1. 20 Foundry tests, all green.')
gap(4)
small('Solidity + Foundry. EvmV1Decoder event checks. Next.js + wagmi UI, every write signed by the user wallet. No server key, no mocks on the verification path.')

// ---------------- PAGE 3 ----------------
doc.addPage(); bg()
eyebrow('Proof it works')
gap(6)
h1('Two assets, two outcomes.')
gap(12)
eyebrow('Scenario A  -  clear asset borrows')
gap(4)
body('Asset 0x6349...0ae9e3. Registered on Sepolia, never pledged. Borrow carried the fresh registration proof. Verified on-chain, financing executed, ALLOW recorded.')
gap(6)
txRow('Register (Sepolia)', '0x1f3fee534c5f757ebd70b979102d43ef01d6baea07a921ff59db72b3c6c1c6d4')
txRow('Borrow (Creditcoin, block 5470652)', '0xab138a65bc019554e1bf5a161451ece5b977791df90c0e2610e8f7188fd16c7d')
gap(18)
eyebrow('Scenario B  -  pledged asset reverts')
gap(4)
body('Asset 0x8bfc...024d9 (uyscutty). Registered, then pledged on Sepolia. Borrow carried the fresh pledge proof. The gate reverted with AssetEncumbered, proven on a live node call and covered by the revert tests. No path through this gate can finance it.')
gap(6)
txRow('Pledge (Sepolia, block 11684010)', '0xd0625d429caab95496629bde3c50c865ac9d4c04bc2e2881d7e39fcd2f23c107')
txRow('Revert reason', 'AssetEncumbered  (0x01d7f74f)  -  live call + 20/20 forge tests')
gap(18)
eyebrow('Links')
gap(6)
linkRow('Live app', LINKS.app)
linkRow('Repository', LINKS.repo)
linkRow('Gate contract', LINKS.gate)
linkRow('Registry contract', LINKS.registry)
linkRow('Borrow tx (A)', LINKS.borrowA)
linkRow('Register tx (A)', LINKS.regA)
linkRow('Pledge tx (B)', LINKS.pledgeB)
linkRow('Proof builder', LINKS.prover)
doc.end()
console.log('wrote', OUT)
