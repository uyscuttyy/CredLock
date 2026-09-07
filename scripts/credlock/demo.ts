/**
 * CredLock two-attempt demo orchestrator.
 *
 * Deterministic, same-asset flow with real transactions on both chains:
 *
 *   Attempt 1 (CLEAR -> ALLOW -> FINANCED)
 *     Sepolia:   registry.registerAsset(assetId)
 *     Attestcoin: inclusion proof of the registration tx (wait for attestation)
 *     Creditcoin: gate.execute(RECORD_CLEAR, proof) -> verdict ALLOW
 *     Creditcoin: gate.requestFinancing(assetId) -> SUCCESS
 *
 *   Foreign-chain state change:
 *     Sepolia:   registry.pledgeAsset(assetId)
 *
 *   Attempt 2 (ENCUMBERED -> BLOCK -> REFUSED)
 *     Attestcoin: inclusion proof of the pledge tx
 *     Creditcoin: gate.execute(RECORD_ENCUMBERED, proof) -> verdict BLOCK
 *     Creditcoin: gate.requestFinancing(assetId) -> REVERTS (AssetEncumbered)
 *
 * Nothing is mocked: every step prints real tx hashes, and the full evidence
 * chain is written to demo-evidence/<assetId>.json for the /gate UI.
 *
 * Usage:
 *   DEMO_PRIVATE_KEY=0x... SEPOLIA_RPC_URL=... CREDITCOIN_TESTNET_RPC_URL=... \
 *   CREDLOCK_GATE_ADDRESS=0x... SOURCE_REGISTRY_ADDRESS=0x... \
 *   npx tsx scripts/credlock/demo.ts [asset-name]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";
import { fetchInclusionProof } from "../../lib/credlock/attest";
import {
  ACTION_RECORD_CLEAR,
  ACTION_RECORD_ENCUMBERED,
  gateContract,
  readVerdict,
  requestFinancing,
  submitProof,
} from "../../lib/credlock/gate";
import { registryContract } from "../../lib/credlock/registry";
import { CREDLOCK_CHAIN, loadCredLockConfig } from "../../lib/credlock/config";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var ${name}`);
  return v;
}

interface StepRecord {
  step: string;
  chain: string;
  txHash?: string;
  detail: string;
}

async function main(): Promise<void> {
  const cfg = loadCredLockConfig();
  if (!cfg.sepoliaRpcUrl) throw new Error("missing SEPOLIA_RPC_URL");
  if (!cfg.gateAddress) throw new Error("missing CREDLOCK_GATE_ADDRESS");
  if (!cfg.registryAddress) throw new Error("missing SOURCE_REGISTRY_ADDRESS");
  const privateKey = env("DEMO_PRIVATE_KEY");

  const assetName = process.argv[2] ?? `credlock-demo-${Date.now()}`;
  const assetId = keccak256(toUtf8Bytes(assetName));
  console.log(`asset: ${assetName}\nassetId: ${assetId}`);

  const sepolia = new JsonRpcProvider(cfg.sepoliaRpcUrl);
  const creditcoin = new JsonRpcProvider(cfg.creditcoinRpcUrl);
  const sepoliaSigner = new Wallet(privateKey, sepolia);
  const ccSigner = new Wallet(privateKey, creditcoin);

  const registry = registryContract(cfg.registryAddress, sepoliaSigner);
  const gate = gateContract(cfg.gateAddress, ccSigner);
  const steps: StepRecord[] = [];

  // ---------- Attempt 1: CLEAR ----------
  console.log("\n--- Attempt 1: register on Sepolia (CLEAR) ---");
  const regTx = await (await registry.registerAsset(assetId)).wait();
  if (!regTx?.hash) throw new Error("register tx missing hash");
  console.log(`register tx: ${regTx.hash}`);
  steps.push({ step: "register", chain: CREDLOCK_CHAIN.sourceChainName, txHash: regTx.hash, detail: "AssetRegistered" });

  console.log("waiting for attestation + building inclusion proof...");
  const clearProof = await fetchInclusionProof(regTx.hash, {
    sepoliaRpcUrl: cfg.sepoliaRpcUrl,
    proofBuilderUrl: cfg.proofBuilderUrl,
  });
  steps.push({
    step: "attest-clear",
    chain: "Creditcoin/Attestcoin",
    txHash: clearProof.txHash,
    detail: `block ${clearProof.headerNumber}, chainKey ${clearProof.chainKey}, cached=${clearProof.cached}`,
  });

  const execClear = await submitProof(gate, ACTION_RECORD_CLEAR, clearProof);
  console.log(`execute(CLEAR) tx: ${execClear}`);
  steps.push({ step: "execute-clear", chain: "Creditcoin", txHash: execClear, detail: "precompile verified" });

  const v1 = await readVerdict(gate, assetId);
  console.log(`verdict: ${v1} (1=ALLOW)`);
  if (v1 !== 1) throw new Error(`expected ALLOW, got ${v1}`);

  const finTx = await requestFinancing(gate, assetId);
  console.log(`financing tx: ${finTx} SUCCESS`);
  steps.push({ step: "financing-attempt-1", chain: "Creditcoin", txHash: finTx, detail: "SUCCESS" });

  // ---------- Foreign-chain state change ----------
  console.log("\n--- Foreign-chain state change: pledge on Sepolia (ENCUMBERED) ---");
  const pledgeTx = await (await registry.pledgeAsset(assetId)).wait();
  if (!pledgeTx?.hash) throw new Error("pledge tx missing hash");
  console.log(`pledge tx: ${pledgeTx.hash}`);
  steps.push({ step: "pledge", chain: CREDLOCK_CHAIN.sourceChainName, txHash: pledgeTx.hash, detail: "AssetPledged" });

  // ---------- Attempt 2: BLOCKED ----------
  console.log("\n--- Attempt 2: prove encumbrance, financing must fail ---");
  const encProof = await fetchInclusionProof(pledgeTx.hash, {
    sepoliaRpcUrl: cfg.sepoliaRpcUrl,
    proofBuilderUrl: cfg.proofBuilderUrl,
  });
  steps.push({
    step: "attest-encumbered",
    chain: "Creditcoin/Attestcoin",
    txHash: encProof.txHash,
    detail: `block ${encProof.headerNumber}, chainKey ${encProof.chainKey}, cached=${encProof.cached}`,
  });

  const execBlock = await submitProof(gate, ACTION_RECORD_ENCUMBERED, encProof);
  console.log(`execute(ENCUMBERED) tx: ${execBlock}`);
  steps.push({ step: "execute-encumbered", chain: "Creditcoin", txHash: execBlock, detail: "precompile verified" });

  const v2 = await readVerdict(gate, assetId);
  console.log(`verdict: ${v2} (2=BLOCK)`);
  if (v2 !== 2) throw new Error(`expected BLOCK, got ${v2}`);

  try {
    await requestFinancing(gate, assetId);
    throw new Error("FINANCING SHOULD HAVE REVERTED BUT SUCCEEDED");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("SHOULD HAVE REVERTED")) throw err;
    console.log(`financing reverted as required: ${msg.slice(0, 160)}`);
    steps.push({ step: "financing-attempt-2", chain: "Creditcoin", detail: `REVERTED: ${msg.slice(0, 200)}` });
  }

  const evidence = {
    assetName,
    assetId,
    sourceChain: CREDLOCK_CHAIN.sourceChainName,
    sourceChainKey: CREDLOCK_CHAIN.sourceChainKey,
    gateAddress: cfg.gateAddress,
    registryAddress: cfg.registryAddress,
    attempt1: { fact: "CLEAR", verdict: "ALLOW", financing: "SUCCESS" },
    attempt2: { fact: "ENCUMBERED", verdict: "BLOCK", financing: "REVERTED" },
    steps,
    ranAt: new Date().toISOString(),
  };
  mkdirSync("demo-evidence", { recursive: true });
  const path = `demo-evidence/${assetId}.json`;
  writeFileSync(path, JSON.stringify(evidence, null, 2));
  console.log(`\nevidence written to ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
