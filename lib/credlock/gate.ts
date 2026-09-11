/**
 * Thin client for the CredLockGate contract on Creditcoin testnet.
 * Reads go through any RPC; writes are signed by the caller's signer so the
 * financing transaction is a real on-chain state transition, never a UI claim.
 */
import { Contract, Signer, Provider } from "ethers";
import type { InclusionProof } from "./attest";

export const GATE_ABI = [
  "function verdictOf(bytes32 assetId) view returns (uint8)",
  "function financed(bytes32 assetId) view returns (bool)",
  "function sourceRegistry() view returns (address)",
  "function sourceChainKey() view returns (uint64)",
  "function requestFinancingWithProof(bytes32 assetId, uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bool)",
  "function setSourceRegistry(address registry, uint64 chainKey)",
  "function execute(uint8 action, uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bool)",
  "event VerdictRecorded(bytes32 indexed assetId, uint8 verdict, bytes32 indexed queryId)",
  "event FinancingExecuted(bytes32 indexed assetId, address indexed borrower)",
] as const;

export const ACTION_RECORD_CLEAR = 0;
export const ACTION_RECORD_ENCUMBERED = 1;

export function gateContract(address: string, runner: Signer | Provider): Contract {
  return new Contract(address, [...GATE_ABI], runner);
}

export async function readVerdict(gate: Contract, assetId: string): Promise<number> {
  return Number(await gate.verdictOf(assetId));
}

/**
 * Submit a real Attestcoin inclusion proof to the gate. The gate verifies it
 * via the BlockProver precompile and records ALLOW (action 0) or BLOCK
 * (action 1). Returns the Creditcoin transaction hash: the inspectable
 * verification record.
 */
export async function submitProof(
  gate: Contract,
  action: number,
  proof: InclusionProof,
): Promise<string> {
  const tx = await gate.execute(
    action,
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleRoot,
    proof.siblings,
    proof.lowerEndpointDigest,
    proof.continuityRoots,
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

/** Borrow with a fresh Attestcoin proof verified inline. Reverts unless CLEAR. */
export async function requestFinancingWithProof(
  gate: Contract,
  assetId: string,
  proof: InclusionProof,
): Promise<string> {
  const tx = await gate.requestFinancingWithProof(
    assetId,
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleRoot,
    proof.siblings,
    proof.lowerEndpointDigest,
    proof.continuityRoots,
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}
