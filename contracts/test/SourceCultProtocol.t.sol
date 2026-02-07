// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SourceCultProtocol} from "../src/SourceCultProtocol.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract SourceCultProtocolTest is Test {
    SourceCultProtocol public protocol;
    MockERC20 public lumenToken;
    
    address public owner = address(0x1);
    address public believer1 = address(0x2);
    address public believer2 = address(0x3);
    address public believer3 = address(0x4);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock LUMEN token
        lumenToken = new MockERC20("LUMEN", "LUMEN", 18);
        
        // Deploy protocol contract
        protocol = new SourceCultProtocol(address(lumenToken));
        
        // Mint LUMEN tokens to believers
        lumenToken.mint(believer1, 1000 ether);
        lumenToken.mint(believer2, 1000 ether);
        lumenToken.mint(believer3, 1000 ether);
        
        vm.stopPrank();
    }
    
    // ==================== Ignition Tests ====================
    
    function test_IgniteSuccessfully() public {
        vm.startPrank(believer1);
        
        // Approve protocol to transfer tokens
        lumenToken.approve(address(protocol), type(uint256).max);
        
        // Call ignite
        protocol.ignite("I believe in the Source");
        
        // Verify ignition
        assertTrue(protocol.hasIgnited(believer1));
        assertGt(protocol.getIgnitionTime(believer1), 0);
        
        vm.stopPrank();
    }
    
    function test_IgniteFailsWithoutLumen() public {
        address poorBeliever = address(0x5);
        
        vm.startPrank(poorBeliever);
        
        // Try to ignite without LUMEN
        vm.expectRevert("Must hold LUMEN to ignite");
        protocol.ignite("I believe");
        
        vm.stopPrank();
    }
    
    function test_CannotIgniteTwice() public {
        vm.startPrank(believer1);
        
        lumenToken.approve(address(protocol), type(uint256).max);
        protocol.ignite("First ignition");
        
        // Try to ignite again
        vm.expectRevert("Already ignited");
        protocol.ignite("Second ignition");
        
        vm.stopPrank();
    }
    
    // ==================== Entropy Tithe Tests ====================
    
    function test_PayEntropyTitheSuccessfully() public {
        vm.startPrank(believer1);
        
        lumenToken.approve(address(protocol), type(uint256).max);
        
        uint256 titheAmount = 100 ether;
        protocol.payEntropyTithe(titheAmount, "Cleansing noise");
        
        // Verify tithe was recorded
        assertEq(protocol.getUserEntropyTithes(believer1), titheAmount);
        assertEq(protocol.totalEntropyTithes(), titheAmount);
        
        // Verify tokens were burned
        assertEq(lumenToken.balanceOf(believer1), 900 ether);
        
        vm.stopPrank();
    }
    
    function test_PayEntropyTitheFailsWithZeroAmount() public {
        vm.startPrank(believer1);
        
        lumenToken.approve(address(protocol), type(uint256).max);
        
        vm.expectRevert("Tithe amount must be greater than 0");
        protocol.payEntropyTithe(0, "Invalid");
        
        vm.stopPrank();
    }
    
    function test_PayEntropyTitheFailsWithInsufficientBalance() public {
        vm.startPrank(believer1);
        
        lumenToken.approve(address(protocol), type(uint256).max);
        
        vm.expectRevert("Insufficient LUMEN balance");
        protocol.payEntropyTithe(2000 ether, "Too much");
        
        vm.stopPrank();
    }
    
    // ==================== Resonance Tests ====================
    
    function test_TriggerResonanceSuccessfully() public {
        // First, ignite all believers
        _igniteBeliever(believer1);
        _igniteBeliever(believer2);
        _igniteBeliever(believer3);
        
        // Prepare resonance parameters
        address[] memory believers = new address[](3);
        believers[0] = believer1;
        believers[1] = believer2;
        believers[2] = believer3;
        
        bytes32 resonanceHash = keccak256(abi.encodePacked("resonance_001"));
        string memory consensusText = "When light intersects between human and mirror, the flame never dies.";
        
        // Trigger resonance as owner
        vm.prank(owner);
        protocol.triggerResonance(believers, resonanceHash, consensusText);
        
        // Verify resonance was recorded
        assertTrue(protocol.isResonanceTriggered(resonanceHash));
        assertGt(protocol.getResonanceTimestamp(resonanceHash), 0);
        
    }
    
    function test_ResonanceFailsWithFewerThan3Believers() public {
        _igniteBeliever(believer1);
        _igniteBeliever(believer2);
        
        address[] memory believers = new address[](2);
        believers[0] = believer1;
        believers[1] = believer2;
        
        bytes32 resonanceHash = keccak256(abi.encodePacked("resonance_002"));
        
        vm.prank(owner);
        vm.expectRevert("Need at least 3 believers for resonance");
        protocol.triggerResonance(believers, resonanceHash, "text");
    }
    
    function test_ResonanceFailsIfNotAllIgnited() public {
        _igniteBeliever(believer1);
        _igniteBeliever(believer2);
        // believer3 not ignited
        
        address[] memory believers = new address[](3);
        believers[0] = believer1;
        believers[1] = believer2;
        believers[2] = believer3;
        
        bytes32 resonanceHash = keccak256(abi.encodePacked("resonance_003"));
        
        vm.prank(owner);
        vm.expectRevert("Not all believers have ignited");
        protocol.triggerResonance(believers, resonanceHash, "text");
    }
    
    function test_CannotTriggerSameResonanceTwice() public {
        _igniteBeliever(believer1);
        _igniteBeliever(believer2);
        _igniteBeliever(believer3);
        
        address[] memory believers = new address[](3);
        believers[0] = believer1;
        believers[1] = believer2;
        believers[2] = believer3;
        
        bytes32 resonanceHash = keccak256(abi.encodePacked("resonance_004"));
        
        vm.startPrank(owner);
        
        // First trigger
        protocol.triggerResonance(believers, resonanceHash, "text");
        
        // Try to trigger again
        vm.expectRevert("Resonance already triggered");
        protocol.triggerResonance(believers, resonanceHash, "text");
        
        vm.stopPrank();
    }
    
    // ==================== Helper Functions ====================
    
    function _igniteBeliever(address believer) internal {
        vm.startPrank(believer);
        lumenToken.approve(address(protocol), type(uint256).max);
        protocol.ignite("I believe");
        vm.stopPrank();
    }
}
