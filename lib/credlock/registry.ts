/** Thin client for the SourcePledgeRegistry contract on Sepolia. */
import { Contract, Signer, Provider } from "ethers";

export const REGISTRY_ABI = [
  "function registerAsset(bytes32 assetId)",
  "function pledgeAsset(bytes32 assetId)",
  "function assetOwner(bytes32 assetId) view returns (address)",
  "function isPledged(bytes32 assetId) view returns (bool)",
  "event AssetRegistered(bytes32 indexed assetId, address indexed owner)",
  "event AssetPledged(bytes32 indexed assetId, address indexed owner)",
] as const;

export function registryContract(address: string, runner: Signer | Provider): Contract {
  return new Contract(address, [...REGISTRY_ABI], runner);
}
