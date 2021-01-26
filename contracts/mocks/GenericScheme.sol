// SPDX-License-Identifier: LGPL-3.0-or-newer
pragma solidity >=0.6.2;

/**
 * @title GenericScheme.
 * @dev  A scheme for proposing and executing calls to an arbitrary function
 * on a specific contract on behalf of the organization avatar.
 */
contract GenericScheme {
    event NewMultiCallProposal(
        address indexed _avatar,
        bytes32 indexed _proposalId,
        bytes[] _callsData,
        uint256[] _values,
        string _descriptionHash,
        address[] _contractsToCall
    );

    address public avatar;

    uint256 public proposalCount;
    mapping(bytes32 => bool) proposalIds;

    constructor() {
        avatar = msg.sender;
    }

    function proposeCalls(
        address[] memory _contractsToCall,
        bytes[] memory _callsData,
        uint256[] memory _values,
        string memory _descriptionHash
    ) public returns (bytes32) {
        // Generate ID for mocking
        bytes32 proposalId = keccak256(abi.encodePacked(_descriptionHash, block.timestamp));
        proposalIds[proposalId] = true;
        proposalCount++;

        emit NewMultiCallProposal(
            address(avatar),
            proposalId,
            _callsData,
            _values,
            _descriptionHash,
            _contractsToCall
        );
        return proposalId;
    }
}
