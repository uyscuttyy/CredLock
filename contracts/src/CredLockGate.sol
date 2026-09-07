// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {
    INativeQueryVerifier,
    NativeQueryVerifierLib
} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";

/// @title CredLockGate
/// @notice Cross-chain verification gate for RWAs on Creditcoin.
/// @dev Before Creditcoin finances an RWA, this contract requires a verified
/// Attestcoin readability proof of the asset's foreign-chain encumbrance fact:
///   proven AssetRegistered (CLEAR)      -> verdict ALLOW -> financing may execute
///   proven AssetPledged (ENCUMBERED)    -> verdict BLOCK -> financing MUST revert
/// The UI and backend are never the security boundary: requestFinancing reads
/// only the on-chain verdict written by verified proofs.
///
/// Verification semantics mirror ASCBase (verify inclusion + continuity via
/// the BlockProver precompile, dedupe by query id), except the entry point
/// additionally pins proofs to the configured source chainKey. ASCBase is not
/// inherited because its execute() is non-virtual and cannot carry that check.
contract CredLockGate is Ownable {
    /// @notice The Native Query Verifier precompile instance (0xFD2 / 4050).
    INativeQueryVerifier public immutable VERIFIER;

    /// @notice Machine-checkable financing verdict per asset.
    enum Verdict {
        NONE,
        ALLOW,
        BLOCK
    }

    /// @notice execute() action discriminators.
    uint8 public constant ACTION_RECORD_CLEAR = 0;
    uint8 public constant ACTION_RECORD_ENCUMBERED = 1;

    /// @notice keccak256("AssetRegistered(bytes32,address)")
    bytes32 public constant REGISTER_EVENT_SIGNATURE =
        0x7b8c7b505365aa1b7f9ce04295e6da7c743d877f121b9debcf6a8a9d1806ce46;
    /// @notice keccak256("AssetPledged(bytes32,address)")
    bytes32 public constant PLEDGE_EVENT_SIGNATURE =
        0xec5c820b7ea68dd3ff08d6f746b3ae69e53ae627cd04e4238a66c25427f0e0ba;

    /// @notice Source-chain registry contract trusted to emit pledge events.
    address public sourceRegistry;
    /// @notice Attestcoin chainKey of the source chain (e.g. 1 = Ethereum Sepolia on testnet).
    uint64 public sourceChainKey;

    mapping(bytes32 => bool) public processedQueries;
    mapping(bytes32 => Verdict) public verdicts;
    mapping(bytes32 => bool) public financed;

    event SourceRegistryUpdated(address indexed registry, uint64 chainKey);
    event VerdictRecorded(bytes32 indexed assetId, Verdict verdict, bytes32 indexed queryId);
    event FinancingExecuted(bytes32 indexed assetId, address indexed borrower);

    error AssetEncumbered();
    error MissingVerification();
    error AlreadyFinanced();
    error InvalidAction(uint8 action);
    error UnregisteredSource();
    error UnexpectedSourceChain();

    constructor(address initialOwner) Ownable(initialOwner) {
        VERIFIER = NativeQueryVerifierLib.getVerifier();
    }

    /// @notice Bind the trusted source registry and its Attestcoin chainKey.
    function setSourceRegistry(address registry, uint64 chainKey) external onlyOwner {
        sourceRegistry = registry;
        sourceChainKey = chainKey;
        emit SourceRegistryUpdated(registry, chainKey);
    }

    /// @notice Read the machine-checkable verdict for an asset.
    function verdictOf(bytes32 assetId) external view returns (Verdict) {
        return verdicts[assetId];
    }

    /// @notice Creditcoin financing action. Reverts unless verdict is ALLOW.
    /// @dev This is the hard gate: BLOCK, NONE, and double-financing all revert.
    function requestFinancing(bytes32 assetId) external returns (bool) {
        Verdict v = verdicts[assetId];
        if (v == Verdict.BLOCK) revert AssetEncumbered();
        if (v != Verdict.ALLOW) revert MissingVerification();
        if (financed[assetId]) revert AlreadyFinanced();
        financed[assetId] = true;
        emit FinancingExecuted(assetId, msg.sender);
        return true;
    }

    /// @notice Verify an Attestcoin readability proof, then record the verdict.
    /// @dev Proofs from any chainKey other than the configured source chain
    /// revert even if otherwise valid: without this, an attacker could replay
    /// a same-address emitter's events from a different supported chain.
    function execute(
        uint8 action,
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external returns (bool success) {
        if (sourceChainKey == 0) revert UnregisteredSource();
        if (chainKey != sourceChainKey) revert UnexpectedSourceChain();

        bytes32 queryId = _computeQueryId(chainKey, blockHeight, merkleRoot, siblings);
        require(!processedQueries[queryId], "Query already processed");

        bool verified = _verifyProof(
            chainKey,
            blockHeight,
            encodedTransaction,
            merkleRoot,
            siblings,
            lowerEndpointDigest,
            continuityRoots
        );
        require(verified, "Proof of inclusion verification failed");

        processedQueries[queryId] = true;
        _processAndEmitEvent(action, queryId, encodedTransaction);
        return true;
    }

    function _processAndEmitEvent(
        uint8 action,
        bytes32 queryId,
        bytes memory encodedTransaction
    ) internal {
        if (action == ACTION_RECORD_CLEAR) {
            bytes32 assetId = _extractAssetId(encodedTransaction, REGISTER_EVENT_SIGNATURE);
            verdicts[assetId] = Verdict.ALLOW;
            emit VerdictRecorded(assetId, Verdict.ALLOW, queryId);
        } else if (action == ACTION_RECORD_ENCUMBERED) {
            bytes32 assetId = _extractAssetId(encodedTransaction, PLEDGE_EVENT_SIGNATURE);
            verdicts[assetId] = Verdict.BLOCK;
            emit VerdictRecorded(assetId, Verdict.BLOCK, queryId);
        } else {
            revert InvalidAction(action);
        }
    }

    function _verifyProof(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) internal returns (bool verified) {
        INativeQueryVerifier.MerkleProof memory merkleProof =
            INativeQueryVerifier.MerkleProof({root: merkleRoot, siblings: siblings});

        INativeQueryVerifier.ContinuityProof memory continuityProof =
            INativeQueryVerifier.ContinuityProof({
                lowerEndpointDigest: lowerEndpointDigest,
                roots: continuityRoots
            });

        verified = VERIFIER.verifyAndEmit(
            chainKey,
            blockHeight,
            encodedTransaction,
            merkleProof,
            continuityProof
        );
    }

    function _computeQueryId(
        uint64 chainKey,
        uint64 blockHeight,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings
    ) internal view returns (bytes32 queryId) {
        INativeQueryVerifier.MerkleProof memory merkleProof =
            INativeQueryVerifier.MerkleProof({root: merkleRoot, siblings: siblings});

        uint256 txIndex = VERIFIER.calculateTxIndex(merkleProof);

        assembly {
            let ptr := mload(0x40)
            mstore(ptr, chainKey)
            mstore(add(ptr, 32), shl(192, blockHeight))
            mstore(add(ptr, 40), txIndex)
            queryId := keccak256(ptr, 72)
        }
    }

    /// @notice Decode the proven transaction and extract the assetId from the
    /// expected event. Reverts on: unregistered source, bad tx type, failed
    /// source tx, missing event, foreign emitter, or malformed topics.
    function _extractAssetId(
        bytes memory encodedTransaction,
        bytes32 eventSignature
    ) internal view returns (bytes32 assetId) {
        if (sourceRegistry == address(0)) revert UnregisteredSource();

        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        require(EvmV1Decoder.isValidTransactionType(txType), "Unsupported transaction type");

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        require(receipt.receiptStatus == 1, "Transaction did not succeed");

        EvmV1Decoder.LogEntry[] memory logs = EvmV1Decoder.getLogsByEventSignature(receipt, eventSignature);
        require(logs.length > 0, "Expected event not found");

        EvmV1Decoder.LogEntry memory log = logs[0];
        require(log.address_ == sourceRegistry, "Event not from registered source");
        require(log.topics.length == 3, "Invalid event topics");
        require(log.topics[0] == eventSignature, "Event signature mismatch");

        assetId = log.topics[1];
    }
}
