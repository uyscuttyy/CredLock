// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SourcePledgeRegistry
/// @notice Minimal RWA pledge registry on the source chain (Ethereum Sepolia).
/// @dev Emits one unambiguous event per state transition so CredLockGate on
/// Creditcoin can verify encumbrance facts via the Attestcoin readability
/// precompile:
///   AssetRegistered -> proves the asset exists and is CLEAR
///   AssetPledged    -> proves the asset is ENCUMBERED
contract SourcePledgeRegistry {
    event AssetRegistered(bytes32 indexed assetId, address indexed owner);
    event AssetPledged(bytes32 indexed assetId, address indexed owner);

    mapping(bytes32 => address) public assetOwner;
    mapping(bytes32 => bool) public isPledged;

    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyPledged();
    error NotOwner();

    /// @notice Register a new RWA identifier. Evidence of a CLEAR asset.
    function registerAsset(bytes32 assetId) external {
        if (assetOwner[assetId] != address(0)) revert AlreadyRegistered();
        assetOwner[assetId] = msg.sender;
        emit AssetRegistered(assetId, msg.sender);
    }

    /// @notice Pledge a registered asset. Evidence of an ENCUMBERED asset.
    function pledgeAsset(bytes32 assetId) external {
        address owner = assetOwner[assetId];
        if (owner == address(0)) revert NotRegistered();
        if (msg.sender != owner) revert NotOwner();
        if (isPledged[assetId]) revert AlreadyPledged();
        isPledged[assetId] = true;
        emit AssetPledged(assetId, owner);
    }
}
