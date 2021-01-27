// SPDX-License-Identifier: LGPL-3.0-or-newer
pragma solidity >=0.8.0;

import './interfaces/IRealitio.sol';
import './interfaces/IGenericSchemeMultiCall.sol';
import './libraries/TransferHelper.sol';
import './libraries/SafeMath.sol';

contract DXdaoArbitrator {
    using SafeMath for uint256;

    IRealitio public realitio;
    IGenericSchemeMultiCall public genericScheme;

    address payable public feeRecipient;
    address public owner;
    uint256 public disputeFee;
    uint256 public disputeCount;
    string public metadata;
    string public proposalDescriptionHash;

    mapping(uint256 => bytes32) public disputeQuestionId;
    mapping(bytes32 => uint256) public arbitrationFees;

    event RequestArbitration(
        bytes32 indexed questionId,
        uint256 feePaid,
        address requester,
        uint256 remaining
    );
    event ProposalCreated(address indexed schemeAddress, bytes32 indexed proposalId);
    event SetRealitio(address indexed realitio);
    event SetDAOstackAvatar(address indexed avatar);
    event SetDAOstackProposalDescriptionHash(string indexed descriptionHash);
    event SetDAOstackPlugin(address indexed plugin);
    event SetMetaData(string indexed metadata);
    event SetDisputeFee(uint256 indexed fee);
    event SetOwner(address indexed owner);
    event SetFeeRecipient(address payable indexed recipient);
    event SubmitAnswerByArbitrator(bytes32 indexed questionId, bytes32 answer, address answerer);
    event Withdraw(address payable indexed recipient, uint256 indexed amount);

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "DXdaoArbitrator: FORBIDDEN"
        );
        _;
    }

    constructor(
        IRealitio _realitio,
        address _owner,
        uint256 _disputeFee,
        string memory _proposalDescriptionHash,
        string memory _metadata,
        address payable _feeRecipient,
        IGenericSchemeMultiCall _genericScheme
    ) {
        require(
            _disputeFee > 0, 'DXdaoArbitrator: INVALID_DISPUTE_FEE'
        );
        realitio = _realitio;
        owner = _owner;
        disputeFee = _disputeFee;
        proposalDescriptionHash = _proposalDescriptionHash;
        metadata = _metadata;
        feeRecipient = _feeRecipient;
        genericScheme = _genericScheme;
    }

    function setRealitio(address _address) public onlyOwner() {
        realitio = IRealitio(_address);
        emit SetRealitio(_address);
    }

    function setDAOstackPlugin(address _address) public onlyOwner() {
        genericScheme = IGenericSchemeMultiCall(_address);
        emit SetDAOstackPlugin(_address);
    }

    function setOwner(address _owner) public onlyOwner() {
        owner = _owner;
        emit SetOwner(_owner);
    }

    function setDAOstackProposalDescriptionHash(string memory _descriptionHash) public onlyOwner() {
        proposalDescriptionHash = _descriptionHash;
        emit SetDAOstackProposalDescriptionHash(_descriptionHash);
    }

    function setMetaData(string memory _metadata) public onlyOwner() {
        metadata = _metadata;
        emit SetMetaData(_metadata);
    }

    function setDisputeFee(uint256 _fee) public onlyOwner() {
        require(_fee > 0, 'DXdaoArbitrator: ZERO_FEE');
        disputeFee = _fee;
        emit SetDisputeFee(_fee);
    }
    
    function setFeeRecipient(address payable _recipient) public onlyOwner() {
        feeRecipient = _recipient;
        emit SetFeeRecipient(_recipient);
    }

    // The arbitrator submits the final answer that resolves the market
    function submitAnswerByArbitrator(
        bytes32 questionId,
        bytes32 answer,
        address answerer
    ) public onlyOwner() {
        delete arbitrationFees[questionId];
        realitio.submitAnswerByArbitrator(questionId, answer, answerer);
        emit SubmitAnswerByArbitrator(questionId, answer, answerer);
    }
    
    // Arbitration can be requested by everyone by paying a dispute fee
    function requestArbitration(bytes32 questionId, uint256 maxPrevious)
        external
        payable
        returns (bool)
    {
        require(
            realitio.getArbitrator(questionId) == address(this),
            'DXdaoArbitrator: WRONG_ARBITRATOR'
        );
        require(!realitio.isFinalized(questionId), 'DXdaoArbitrator: FINALIZED_QUESTION');
        disputeQuestionId[disputeCount] = questionId;
        disputeCount++;
        arbitrationFees[questionId] = arbitrationFees[questionId].add(msg.value);
        uint256 feePaid = arbitrationFees[questionId];
        if (feePaid >= disputeFee) {
            bytes memory encodedCall = abi.encodeWithSelector(
                bytes4(keccak256('disputeResolutionNotification(bytes32)')),
                questionId
            );

            address[] memory contractsToCall = new address[](1);
            bytes[] memory callsData = new bytes[](1);
            uint256[] memory values = new uint256[](1);
            contractsToCall[0] = address(this);
            callsData[0] = encodedCall;
            values[0] = uint256(0);

            bytes32 proposalId = genericScheme.proposeCalls(contractsToCall, callsData, values, proposalDescriptionHash);
            emit ProposalCreated(address(genericScheme), proposalId);
            realitio.notifyOfArbitrationRequest(questionId, msg.sender, maxPrevious);
            emit RequestArbitration(questionId, msg.value, msg.sender, 0);
            TransferHelper.safeTransferETH(feeRecipient, feePaid);
            emit Withdraw(feeRecipient, feePaid);
            return true;
        } else {
            emit RequestArbitration(questionId, msg.value, msg.sender, disputeFee.sub(feePaid));
            return false;
        }
    }
    
    // Function to be called from realitio to fetch dispute fee
    function getDisputeFee(bytes32 questionId) external view returns (uint256) {
        return disputeFee;
    }

    // Utility function used for Alchemy proposal
    function disputeResolutionNotification(bytes32 questionId) external pure returns (bytes32) {
      return questionId;
    }

}
