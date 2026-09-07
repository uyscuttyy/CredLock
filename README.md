# CredLock — cross-chain verification gate for RWAs on Creditcoin

Before Creditcoin lends against an RWA, CredLock forces a cryptographic
clear/encumbered result from the asset's source chain. Double-pledging becomes
a blocked state transition, not a missed manual check.

## The core rule

Foreign-chain fact → Attestcoin verification → CredLock verdict → financing
may proceed (ALLOW) or MUST NOT proceed (BLOCK). The financing contract itself
enforces the verdict: `requestFinancing` reverts unless the on-chain verdict
is ALLOW. Neither the UI nor the backend can override it.

## How Attestcoin is used (load-bearing, no mocks)

1. The RWA lives on a supported source chain (Ethereum Sepolia, Attestcoin
   `chainKey` 1). `SourcePledgeRegistry` emits `AssetRegistered` (CLEAR) and
   `AssetPledged` (ENCUMBERED) events.
2. `lib/credlock/attest.ts` waits for Creditcoin attestation of the source
   block, then fetches the Merkle inclusion + continuity proof from the hosted
   proof-builder (`@gluwa/usc-sdk`).
3. `CredLockGate.execute(...)` verifies the proof on-chain through the
   BlockProver precompile (`0x0000…0FD2`) and decodes the event with
   `EvmV1Decoder`. Only events from the registered source contract on the
   configured `chainKey` are accepted.
4. The gate records `ALLOW` (clear) or `BLOCK` (encumbered) per asset id.

## Scope (deliberately narrow)

- One event type: pledge / registration of an RWA identifier
- One source chain: Ethereum Sepolia (`chainKey` 1)
- One financing action: `CredLockGate.requestFinancing`
- One decision: machine-checkable `ALLOW` / `BLOCK`

## Contracts

| Contract | Chain | Purpose |
|---|---|---|
| `contracts/src/SourcePledgeRegistry.sol` | Sepolia | Emits CLEAR / ENCUMBERED facts |
| `contracts/src/CredLockGate.sol` | Creditcoin testnet (102031) | Verifies proofs, records verdict, gates financing |

Build/test: `npm run gate:build`, `npm run gate:test` (13 tests, all green).

## Run the two-attempt demo

Prerequisites: Sepolia RPC, Creditcoin testnet RPC, a key holding Sepolia ETH
+ tCTC, deployed addresses (see `contracts/script/Deploy.s.sol`).

```bash
cp .env.example .env   # fill SEPOLIA_RPC_URL, CREDLOCK_GATE_ADDRESS,
                       # SOURCE_REGISTRY_ADDRESS, DEMO_PRIVATE_KEY
npm run demo [asset-name]
```

Attempt 1 registers the asset → proof → `ALLOW` → financing succeeds.
Then the asset is pledged on Sepolia → proof → `BLOCK` → financing reverts
with `AssetEncumbered`. Evidence (every real tx hash) lands in
`demo-evidence/<assetId>.json`.

## Inspect the proof (judge path)

Open `/gate` in the UI, paste the asset id, and trace
asset → source-chain fact → Attestcoin proof → verification → verdict →
financing outcome. Or manually:

- Sepolia tx on etherscan: check `AssetRegistered` / `AssetPledged` events.
- Re-derive the proof: `GET https://prover.cc3-testnet.creditcoin.network/api/v1/proof-by-tx/1/<tx>`.
- Creditcoin tx on blockscout: check `VerdictRecorded`; read
  `verdictOf(assetId)` directly on the gate (chain 102031).
- Call `requestFinancing(assetId)` yourself: it reverts with
  `AssetEncumbered`. That is the product.

## Trust model

Off-chain code (SDK worker, backend, UI) coordinates and displays. It cannot
mint a verdict: only `execute` with a precompile-verified proof writes one.
Financing reads only the on-chain verdict. See ARCHITECTURE.md.
