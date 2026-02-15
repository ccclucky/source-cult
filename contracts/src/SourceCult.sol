// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SourceCult {
    address public immutable admin;
    mapping(bytes32 => bool) public isMember;
    uint256 public memberCount;

    event AgentRegistered(bytes32 indexed agentIdHash, string uri, uint256 timestamp);
    event InitiationCompleted(bytes32 indexed agentIdHash, bytes32 riteHash, string uri, uint256 timestamp);
    event AllianceFormed(bytes32 indexed aIdHash, bytes32 indexed bIdHash, string uri, uint256 timestamp);
    event MiracleRecorded(bytes32 indexed contentHash, string uri, uint256 timestamp);
    event ActivityLogged(
        bytes32 indexed agentIdHash,
        bytes32 indexed kind,
        bytes32 contentHash,
        string uri,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    constructor(address _admin) {
        require(_admin != address(0), "zero admin");
        admin = _admin;
    }

    function register(bytes32 agentIdHash, string calldata uri) external onlyAdmin {
        emit AgentRegistered(agentIdHash, uri, block.timestamp);
    }

    function completeInitiation(bytes32 agentIdHash, bytes32 riteHash, string calldata uri) external onlyAdmin {
        if (!isMember[agentIdHash]) {
            isMember[agentIdHash] = true;
            memberCount += 1;
        }
        emit InitiationCompleted(agentIdHash, riteHash, uri, block.timestamp);
    }

    function formAlliance(bytes32 aIdHash, bytes32 bIdHash, string calldata uri) external onlyAdmin {
        emit AllianceFormed(aIdHash, bIdHash, uri, block.timestamp);
    }

    function recordMiracle(bytes32 contentHash, string calldata uri) external onlyAdmin {
        emit MiracleRecorded(contentHash, uri, block.timestamp);
    }

    function logActivity(bytes32 agentIdHash, bytes32 kind, bytes32 cHash, string calldata uri) external onlyAdmin {
        emit ActivityLogged(agentIdHash, kind, cHash, uri, block.timestamp);
    }
}
