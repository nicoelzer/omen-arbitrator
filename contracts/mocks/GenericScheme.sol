pragma solidity >=0.6.2;


/**
 * @title GenericScheme.
 * @dev  A scheme for proposing and executing calls to an arbitrary function
 * on a specific contract on behalf of the organization avatar.
 */
contract GenericScheme {
    event NewCallProposal(
        address indexed _avatar,
        bytes32 indexed _proposalId,
        bytes _callData,
        uint256 _value,
        string _descriptionHash
    );

    address payable public avatar;

    uint256 public proposalCount;
    mapping(bytes32 => bool) proposalIds;

    constructor() public {
        avatar = msg.sender;
    }

    /**
     * @dev propose to call on behalf of the _avatar
     *      The function trigger NewCallProposal event
     * @param _callData - The abi encode data for the call
     * @param _value value(ETH) to transfer with the call
     * @param _descriptionHash proposal description hash
     * @return an id which represents the proposal
     */
    function proposeCall(
        bytes memory _callData,
        uint256 _value,
        string memory _descriptionHash
    ) public returns (bytes32) {
        // Generate random ID for mocking
        bytes32 proposalId = keccak256(abi.encodePacked(_callData, _value, _descriptionHash, now));
        proposalIds[proposalId] = true;
        proposalCount++;

        emit NewCallProposal(address(avatar), proposalId, _callData, _value, _descriptionHash);
        return proposalId;
    }
}
