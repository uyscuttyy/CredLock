// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "./Script.sol";
import {SourcePledgeRegistry} from "../src/SourcePledgeRegistry.sol";
import {CredLockGate} from "../src/CredLockGate.sol";

/// @notice Deployment helper. forge script is chain-agnostic: point
/// --rpc-url at Sepolia to deploy the registry, or at Creditcoin testnet
/// to deploy the gate. Wiring (setSourceRegistry) is a separate owner step
/// so each deployment logs its own address first.
contract DeployRegistry is Script {
    function run() external returns (SourcePledgeRegistry registry) {
        vm.startBroadcast();
        registry = new SourcePledgeRegistry();
        vm.stopBroadcast();
    }
}

contract DeployGate is Script {
    function run(address owner) external returns (CredLockGate gate) {
        vm.startBroadcast();
        gate = new CredLockGate(owner);
        vm.stopBroadcast();
    }
}
