/**
 * CredLock network + deployment configuration.
 * All deployment-specific values come from the environment; the constants
 * below are protocol facts verified against the official docs.
 */
export const CREDLOCK_CHAIN = {
  /** Creditcoin CC3 Testnet EVM chain ID (docs.creditcoin.org). */
  creditcoinChainId: 102031,
  /** Attestcoin chainKey for Ethereum Sepolia on CC3 testnet. */
  sourceChainKey: 1,
  sourceChainName: "Ethereum Sepolia",
  sourceChainEvmId: 11155111,
  /** Block-prover (readability verifier) precompile on Creditcoin. */
  blockProverPrecompile: "0x0000000000000000000000000000000000000FD2",
  /** Chain-info precompile on Creditcoin. */
  chainInfoPrecompile: "0x0000000000000000000000000000000000000fd3",
} as const;

export interface CredLockConfig {
  creditcoinRpcUrl: string;
  sepoliaRpcUrl: string;
  proofBuilderUrl: string;
  gateAddress: string;
  registryAddress: string;
}

export function loadCredLockConfig(): CredLockConfig {
  return {
    creditcoinRpcUrl:
      process.env.CREDITCOIN_TESTNET_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network",
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL ?? "",
    proofBuilderUrl:
      process.env.ATTESTCOIN_PROOF_BUILDER_URL ?? "https://prover.cc3-testnet.creditcoin.network",
    gateAddress: process.env.CREDLOCK_GATE_ADDRESS ?? "",
    registryAddress: process.env.SOURCE_REGISTRY_ADDRESS ?? "",
  };
}
