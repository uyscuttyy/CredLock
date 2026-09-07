// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "../lib/Test.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {SourcePledgeRegistry} from "../src/SourcePledgeRegistry.sol";
import {CredLockGate} from "../src/CredLockGate.sol";

/// @notice Stand-in for the Attestcoin block-prover precompile (0xFD2).
/// Etched at the precompile address in setUp; result is toggleable so tests
/// prove both the valid-proof and invalid-proof paths through execute().
contract MockVerifier {
    bool public result = true;

    function setResult(bool r) external {
        result = r;
    }

    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        INativeQueryVerifier.MerkleProof calldata,
        INativeQueryVerifier.ContinuityProof calldata
    ) external view returns (bool) {
        return result;
    }

    function calculateTxIndex(INativeQueryVerifier.MerkleProof calldata) external pure returns (uint64) {
        return 0;
    }
}

contract CredLockGateTest is Test {
    address internal constant PRECOMPILE = 0x0000000000000000000000000000000000000FD2;

    SourcePledgeRegistry internal registry;
    CredLockGate internal gate;
    MockVerifier internal mock;

    bytes32 internal constant ASSET = keccak256("credlock-demo-asset-1");
    uint64 internal constant CHAIN_KEY = 1; // Ethereum Sepolia on CC3 testnet
    uint64 internal nextHeight = 1000;

    function setUp() public {
        registry = new SourcePledgeRegistry();
        gate = new CredLockGate(address(this));
        gate.setSourceRegistry(address(registry), CHAIN_KEY);

        mock = new MockVerifier();
        vm.etch(PRECOMPILE, address(mock).code);
        // NOTE: `etch` copies runtime code only, so the `result = true`
        // initializer is lost; re-arm the mock explicitly.
        MockVerifier(PRECOMPILE).setResult(true);
    }

    // ---- fixture builders ----

    function _topics(bytes32 sig, bytes32 assetId, address owner) internal pure returns (bytes32[] memory) {
        bytes32[] memory t = new bytes32[](3);
        t[0] = sig;
        t[1] = assetId;
        t[2] = bytes32(uint256(uint160(owner)));
        return t;
    }

    /// @dev Build EvmV1Decoder-compatible type-2 encoded transaction bytes.
    function _encodeTx(address emitter, bytes32[] memory topics, uint8 status) internal view returns (bytes memory) {
        bytes[] memory chunks = new bytes[](3);
        chunks[0] = abi.encode(uint64(1), uint64(1_000_000), address(this), false, emitter, uint256(0), bytes(""));
        EvmV1Decoder.AccessListEntryBytes32[] memory al = new EvmV1Decoder.AccessListEntryBytes32[](0);
        chunks[1] = abi.encode(uint64(11155111), uint128(1), uint128(2), al, uint8(0), bytes32(0), bytes32(0));
        EvmV1Decoder.LogEntryTuple[] memory logs = new EvmV1Decoder.LogEntryTuple[](1);
        logs[0] = EvmV1Decoder.LogEntryTuple({address_: emitter, topics: topics, data: bytes("")});
        chunks[2] = abi.encode(status, uint64(21000), logs, bytes(""));
        return abi.encode(uint8(2), chunks);
    }

    function _submit(uint8 action, bytes memory encodedTx) internal returns (bool) {
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        return gate.execute(action, CHAIN_KEY, nextHeight++, encodedTx, bytes32(0), siblings, bytes32(0), roots);
    }

    function _registerProof() internal returns (bytes memory) {
        return _encodeTx(address(registry), _topics(gate.REGISTER_EVENT_SIGNATURE(), ASSET, address(this)), 1);
    }

    function _pledgeProof() internal returns (bytes memory) {
        return _encodeTx(address(registry), _topics(gate.PLEDGE_EVENT_SIGNATURE(), ASSET, address(this)), 1);
    }

    // ---- verdict + financing gate ----

    function test_ClearProofRecordsAllowAndFinancingSucceeds() public {
        assertTrue(_submit(gate.ACTION_RECORD_CLEAR(), _registerProof()));
        assertEq(uint8(gate.verdictOf(ASSET)), uint8(CredLockGate.Verdict.ALLOW));
        assertTrue(gate.requestFinancing(ASSET));
        assertTrue(gate.financed(ASSET));
    }

    function test_EncumberedProofRecordsBlockAndFinancingReverts() public {
        assertTrue(_submit(gate.ACTION_RECORD_ENCUMBERED(), _pledgeProof()));
        assertEq(uint8(gate.verdictOf(ASSET)), uint8(CredLockGate.Verdict.BLOCK));
        vm.expectRevert(CredLockGate.AssetEncumbered.selector);
        gate.requestFinancing(ASSET);
    }

    function test_SameAssetClearThenEncumberedFlipsToBlock() public {
        _submit(gate.ACTION_RECORD_CLEAR(), _registerProof());
        assertTrue(gate.requestFinancing(ASSET));
        // Foreign-chain state changes: asset pledged, proof submitted.
        _submit(gate.ACTION_RECORD_ENCUMBERED(), _pledgeProof());
        assertEq(uint8(gate.verdictOf(ASSET)), uint8(CredLockGate.Verdict.BLOCK));
        // Second financing must not proceed: BLOCK takes precedence.
        vm.expectRevert(CredLockGate.AssetEncumbered.selector);
        gate.requestFinancing(ASSET);
    }

    function test_FinancingWithoutVerificationReverts() public {
        vm.expectRevert(CredLockGate.MissingVerification.selector);
        gate.requestFinancing(ASSET);
    }

    function test_DoubleFinancingReverts() public {
        _submit(gate.ACTION_RECORD_CLEAR(), _registerProof());
        gate.requestFinancing(ASSET);
        vm.expectRevert(CredLockGate.AlreadyFinanced.selector);
        gate.requestFinancing(ASSET);
    }

    // ---- verification boundary ----

    function test_InvalidProofReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes memory proof = _registerProof();
        MockVerifier(PRECOMPILE).setResult(false);
        vm.expectRevert("Proof of inclusion verification failed");
        _submit(action, proof);
    }

    function test_WrongChainKeyReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes memory proof = _registerProof();
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        vm.expectRevert(CredLockGate.UnexpectedSourceChain.selector);
        gate.execute(action, 3, nextHeight++, proof, bytes32(0), siblings, bytes32(0), roots);
    }

    function test_ForeignEmitterReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes32 sig = gate.REGISTER_EVENT_SIGNATURE();
        bytes memory forged = _encodeTx(
            address(0xdead), _topics(sig, ASSET, address(this)), 1
        );
        vm.expectRevert("Event not from registered source");
        _submit(action, forged);
    }

    function test_WrongEventForActionReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes memory proof = _pledgeProof();
        vm.expectRevert("Expected event not found");
        _submit(action, proof);
        assertEq(uint8(gate.verdictOf(ASSET)), uint8(CredLockGate.Verdict.NONE));
    }

    function test_FailedSourceTxReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes32 sig = gate.REGISTER_EVENT_SIGNATURE();
        bytes memory failed = _encodeTx(
            address(registry), _topics(sig, ASSET, address(this)), 0
        );
        vm.expectRevert("Transaction did not succeed");
        _submit(action, failed);
    }

    function test_ReplayReverts() public {
        uint8 action = gate.ACTION_RECORD_CLEAR();
        bytes memory proof = _registerProof();
        uint64 height = nextHeight++;
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory roots = new bytes32[](0);
        assertTrue(gate.execute(action, CHAIN_KEY, height, proof, bytes32(0), siblings, bytes32(0), roots));
        vm.expectRevert("Query already processed");
        gate.execute(action, CHAIN_KEY, height, proof, bytes32(0), siblings, bytes32(0), roots);
    }

    function test_InvalidActionReverts() public {
        bytes memory proof = _registerProof();
        vm.expectRevert(abi.encodeWithSelector(CredLockGate.InvalidAction.selector, 7));
        _submit(7, proof);
    }

    // ---- source registry sanity ----

    function test_SourceRegistryRegisterAndPledge() public {
        registry.registerAsset(ASSET);
        assertEq(registry.assetOwner(ASSET), address(this));
        registry.pledgeAsset(ASSET);
        assertTrue(registry.isPledged(ASSET));
    }
}
