// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Minimal subset of forge-std's Script contract: exposes the
/// broadcast cheatcodes so `forge script --broadcast` works without a git
/// dependency on forge-std.
interface VmScript {
    function startBroadcast() external;
    function startBroadcast(address signer) external;
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract Script {
    VmScript internal constant vm = VmScript(address(uint160(uint256(keccak256("hevm cheat code")))));
}
