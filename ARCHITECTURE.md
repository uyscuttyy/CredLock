# CredLock architecture note

## Flow

```
Sepolia: AssetRegistered / AssetPledged event (SourcePledgeRegistry)
  ↓  (attestors agree on source-chain state; recorded on Creditcoin)
Attestcoin readability: Merkle inclusion proof + continuity proof
  ↓  (off-chain worker fetches via proof-builder; anyone can re-derive)
CredLockGate.execute: BlockProver precompile verifies proof on-chain,
EvmV1Decoder extracts the event, emitter + chainKey are pinned
  ↓
verdicts[assetId] = ALLOW (clear) | BLOCK (encumbered)
  ↓
requestFinancing: proceeds iff verdict == ALLOW, else reverts
```

## Boundaries

| Concern | Where | Trust |
|---|---|---|
| Source fact emission | Sepolia registry contract | On-chain; event must come from the registered contract address |
| Attestation of source state | Attestcoin attestor set | Decentralized; threshold consensus, not a single oracle |
| Proof building | `lib/credlock/attest.ts` via `/api/gate/proof` (public RPC + public builder) | Untrusted coordination: can withhold proofs, cannot forge a verdict — a bad proof reverts on-chain |
| Proof verification | BlockProver precompile 0xFD2, called by the gate | Cryptographic; synchronous in the same tx |
| Verdict storage | `CredLockGate.verdicts` | On-chain; writable only via verified `execute` |
| Financing enforcement | `CredLockGate.requestFinancing` | On-chain hard gate: BLOCK/NONE/double-spend all revert |
| Display + reads | `/gate` UI, `/api/gate/asset` (live event/state reads only) | Untrusted display; the UI is never the security boundary |
| Writes | visitor's wallet via wagmi (register, pledge, execute, finance) | No server key exists; chains verify signatures |

## Replay and spoofing

- `processedQueries` dedupes proofs: one source tx yields one verdict write.
- Emitter pinning: logs must come from the owner-registered source registry.
- Chain pinning: `execute` reverts unless `chainKey == sourceChainKey`, so a
  same-address contract on another supported chain cannot inject facts.
- Receipt status must be 1: failed source transactions prove nothing.
- `InvalidAction` + event/action matching: a CLEAR proof can never set BLOCK
  and a pledge event can never set ALLOW.

## What is intentionally out of scope

Multiple asset types, more source chains, generalized messaging/bridges,
privacy layers. Each would widen the trusted surface before the gate is proven.
