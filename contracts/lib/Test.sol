// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Minimal cheatcode interface (subset of forge-std's Vm) so the test
/// suite builds without a git dependency on forge-std.
interface Vm {
    function etch(address who, bytes calldata code) external;
    function expectRevert() external;
    function expectRevert(bytes calldata revertData) external;
    function expectRevert(bytes4 revertData) external;
}

/// @notice Minimal test base with assertions and the `vm` cheatcode handle.
contract Test {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertTrue(bool b) internal pure {
        require(b, "assertTrue failed");
    }

    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "assertEq(uint) failed");
    }

    function assertEq(address a, address b) internal pure {
        require(a == b, "assertEq(address) failed");
    }

    function assertEq(bool a, bool b) internal pure {
        require(a == b, "assertEq(bool) failed");
    }
}
