// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SourceCult.sol";

contract Deploy is Script {
    function run() external returns (SourceCult deployed) {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(key);

        vm.startBroadcast(key);
        deployed = new SourceCult(admin);
        vm.stopBroadcast();
    }
}
