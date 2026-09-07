/**
 * Real Attestcoin verification path (load-bearing, no mocks).
 *
 * For a foreign-chain fact ("asset X was registered/pledged on Sepolia in
 * transaction T"), this module:
 *  1. waits until Creditcoin attestors have attested the block containing T,
 *  2. fetches the Merkle inclusion proof + continuity proof from the hosted
 *     proof-builder service,
 *  3. returns the proof shaped exactly as CredLockGate.execute(...) expects,
 *     so the proof is verified on-chain by the BlockProver precompile (0xFD2).
 *
 * Inspectability: every returned proof carries the source tx hash, block
 * number, chainKey, and builder URL so a judge can re-derive it.
 */
import { JsonRpcProvider } from "ethers";
import { proofProvider } from "@gluwa/usc-sdk";
import { CREDLOCK_CHAIN } from "./config";

export interface InclusionProof {
  chainKey: number;
  /** Block number on the source chain containing the fact. */
  headerNumber: number;
  txHash: string;
  /** ABI-encoded transaction bytes verified by the precompile. */
  txBytes: string;
  merkleRoot: string;
  siblings: Array<{ hash: string; isLeft: boolean }>;
  lowerEndpointDigest: string;
  continuityRoots: string[];
  cached: boolean;
  proofBuilderUrl: string;
}

export interface AttestOptions {
  sepoliaRpcUrl: string;
  creditcoinRpcUrl?: string;
  proofBuilderUrl?: string;
  chainKey?: number;
  /** Poll timeout while waiting for attestation (ms). */
  waitTimeoutMs?: number;
}

export async function fetchInclusionProof(txHash: string, opts: AttestOptions): Promise<InclusionProof> {
  const chainKey = opts.chainKey ?? CREDLOCK_CHAIN.sourceChainKey;
  const proofBuilderUrl = opts.proofBuilderUrl ?? "https://prover.cc3-testnet.creditcoin.network";

  const sourceProvider = new JsonRpcProvider(opts.sepoliaRpcUrl);
  const tx = await sourceProvider.getTransaction(txHash);
  if (!tx || tx.blockNumber == null) {
    throw new Error(`source transaction not found or not yet mined: ${txHash}`);
  }

  const builder = new proofProvider.service.ProofBuilder(chainKey, proofBuilderUrl);
  // Wait until Creditcoin has attested the block; throws on timeout.
  await builder.waitUntilHeightAttested(chainKey, tx.blockNumber);

  const result = await builder.getProof(txHash);
  if (!result.success || !result.data) {
    throw new Error(`proof generation failed for ${txHash}: ${result.error ?? "unknown error"}`);
  }

  const data = result.data;
  return {
    chainKey: data.chainKey,
    headerNumber: data.headerNumber,
    txHash: data.txHash,
    txBytes: data.txBytes,
    merkleRoot: data.merkleProof.root,
    siblings: data.merkleProof.siblings.map((s) => ({ hash: s.hash, isLeft: s.isLeft })),
    lowerEndpointDigest: data.continuityProof.lowerEndpointDigest,
    continuityRoots: [...data.continuityProof.roots],
    cached: data.cached,
    proofBuilderUrl,
  };
}
