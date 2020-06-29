pragma solidity >=0.6.2;

import './interfaces/IRealitio.sol';
import './interfaces/IGenericScheme.sol';
import './interfaces/IRealitioProxy.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/// @title DXdao Omen Arbitrator
/// @notice A realit.io arbitrator contract to request and submit dispute resolutions to the DXdao.
contract DXdaoArbitrator is Ownable {
    using SafeMath for uint256;

    IRealitio public realitio;
    IRealitioProxy public realitioProxy;
    IGenericScheme public genericScheme;

    /** @dev Address of DAOstack Avatar */
    address public DAOstackAvatar;

    /** @dev Fee in ETH charged to resolve dispute */
    uint256 public disputeFee;

    /** @dev DescriptionHash used to create DAOstack proposal */
    string public proposalDescriptionHash;

    /** @dev Metadata to be provided for Realitio Dapp */
    string public metadata;

    /** @dev Address to which fees will be transfered */
    address payable public feeRecipient;

    /** @dev Incremental dispute number */
    uint256 public disputeCount;

    /** @dev Mapping for look up QuestionId by disputeCount */
    mapping(uint256 => bytes32) public disputeQuestionId;

    /** @dev Mapping of type questionId -> Fees */
    mapping(bytes32 => uint256) public arbitrationFees;

    /** @dev Event emitted when a dispute resolution is requested. */
    event RequestArbitration(
        bytes32 indexed questionId,
        uint256 feePaid,
        address requester,
        uint256 remaining
    );

    /** @dev Event emitted when a proposal was created. */
    event ProposalCreated(address schemeAddress, bytes32 proposalId);

    /** @dev Event emitted when the corresponding Realitio contract address is changed. */
    event SetRealitio(address realitio);

    /** @dev Event emitted when the corresponding Realitio Proxy contract address is changed. */
    event SetRealitioProxy(address realitio);

    /** @dev Event emitted when the Avatar contract address is changed. */
    event SetDAOstackAvatar(address avatar);

    /** @dev Event emitted when the Proposal description is changed. */
    event SetDAOstackProposalDescriptionHash(string descriptionHash);

    /** @dev Event emitted when the Plugin contract address is changed. */
    event SetDAOstackPlugin(address plugin);

    /** @dev Event emitted when Realitio Metadata is changed. */
    event SetMetaData(string metadata);

    /** @dev Event emitted when DisputeFee is changed. */
    event SetDisputeFee(uint256 fee);

    /** @dev Event emitted when the recipient to receive fees is changed. */
    event SetFeeRecipient(address payable recipient);

    /** @dev Event emitted when abitrator submits an answer. */
    event SubmitAnswerByArbitrator(bytes32 indexed questionId, bytes32 answer, address answerer);

    /** @dev Event emitted when fees are withdrawn. */
    event Withdraw(address payable recipient, uint256 amount);

    /** @dev Owner facing function used to change the realitio contract address it's interacting with.
     * @param _address address of coresponding realitio contract
     * Emits an {SetRealitio} event.
     */
    function setRealitio(address _address) public onlyOwner() {
        realitio = IRealitio(_address);
        emit SetRealitio(_address);
    }

    /** @dev Owner facing function used to change the realitioProxy contract address it's pulling answers from.
     * @param _address address of coresponding realitioProxy contract
     * Emits an {SetRealitioProxy} event.
     */
    function setRealitioProxy(address _address) public onlyOwner() {
        realitioProxy = IRealitioProxy(_address);
        emit SetRealitioProxy(_address);
    }

    /** @dev Owner facing function used to change the address of the DAOstack Alchemy Generic Scheme address
     * @param _address address of coresponding DAOstack Plugiin
     * Emits an {SetDAOstackPlugin} event.
     */
    function setDAOstackPlugin(address _address) public onlyOwner() {
        genericScheme = IGenericScheme(_address);
        emit SetDAOstackPlugin(_address);
    }

    /** @dev Owner facing function used to change the address of the DAOstack Avatar address
     * @param _DAOstackAvatar address of coresponding DAOstack Plugiin
     * Emits an {SetDAOstackAvatar} event.
     */
    function setDAOstackAvatar(address _DAOstackAvatar) public onlyOwner() {
        DAOstackAvatar = _DAOstackAvatar;
        emit SetDAOstackAvatar(_DAOstackAvatar);
    }

    /** @dev Owner facing function used to change the DescriptionHash for the DAOstack Proposal
     * @param _descriptionHash String of descriptionHash
     */
    function setDAOstackProposalDescriptionHash(string memory _descriptionHash) public onlyOwner() {
        proposalDescriptionHash = _descriptionHash;
        emit SetDAOstackProposalDescriptionHash(_descriptionHash);
    }

    /** @dev Owner facing function used to change metadata used by realitio dApp.
     * Set a metadata string, expected to be JSON, containing things like arbitrator TOS address
     * @param _metadata JSON metadata string
     * Emits an {SetMetaData} event.
     */
    function setMetaData(string memory _metadata) public onlyOwner() {
        metadata = _metadata;
        emit SetMetaData(_metadata);
    }

    /** @dev Owner facing function used to modify the fee to be charged.
     * @param _fee amount in ETH to be charged.
     * Emits an {SetDisputeFee} event.
     */
    function setDisputeFee(uint256 _fee) public onlyOwner() {
        disputeFee = _fee;
        emit SetDisputeFee(_fee);
    }

    /** @dev Owner facing function used to change the recipient that receives the charged fees.
     * @param _recipient address of receiver.
     * Emits an {SetFeeRecipient} event.
     */
    function setFeeRecipient(address payable _recipient) public onlyOwner() {
        feeRecipient = _recipient;
        emit SetFeeRecipient(_recipient);
    }

    /** @dev Submit the abitrators's answer to a question.
     * @param questionId realitio questionId for reference.
     * @param answer hashed final answer.
     * @param answerer address of answerer. If arbitration changed the answer, it should be the payer. If not, the old answerer.
     * Emits an {submitAnswerByArbitrator} event.
     */
    function submitAnswerByArbitrator(
        bytes32 questionId,
        bytes32 answer,
        address answerer
    ) public onlyOwner() {
        delete arbitrationFees[questionId];
        realitio.submitAnswerByArbitrator(questionId, answer, answerer);
        emit SubmitAnswerByArbitrator(questionId, answer, answerer);
    }

    /** @dev Submit the abitrators's answer to a question.
     * @param questionId realitio questionId for reference.
     * @return the fee in ETH to charged by abitrator.
     */
    function getDisputeFee(bytes32 questionId) public view returns (uint256) {
        return disputeFee;
    }

    /** @dev Called by realitio to request abitration. Question on realitio will be freezed until answered is provided by submitAnswerByArbitrator()
     * @param questionId realitio questionId for reference.
     * @param maxPrevious If specified, reverts if a bond higher than this was submitted after you sent your transaction.
     * Emits an {RequestArbitration} event.
     */
    function requestArbitration(bytes32 questionId, uint256 maxPrevious)
        external
        payable
        returns (bool)
    {
        uint256 arbitrationFee = getDisputeFee(questionId);
        require(address(realitioProxy) != address(0), 'DXdaoArbitrator: NO_REALITIOPROXY_ADDRESS');
        require(
            realitio.getArbitrator(questionId) == address(this),
            'DXdaoArbitrator: WRONG_ARBITRATOR'
        );
        require(!realitio.isFinalized(questionId), 'DXdaoArbitrator: FINALIZED_QUESTION');
        require(arbitrationFee > 0, 'DXdaoArbitrator: ZERO_FEE');
        disputeQuestionId[disputeCount] = questionId;
        arbitrationFees[questionId] = arbitrationFees[questionId].add(msg.value);
        uint256 paid = arbitrationFees[questionId];
        disputeCount++;
        if (paid >= arbitrationFee) {
            uint256 answerCount = realitioProxy.getAnswerCountByQuestionId(questionId);
            for (uint32 i = 0; i < answerCount; i++) {
                string memory singleAnswer = realitioProxy.getSingleAnswerByQuestionId(
                    questionId,
                    i
                );
                bytes memory encodedCall = abi.encodeWithSelector(
                    bytes4(keccak256('disputeResolutionVote(bytes32)')),
                    singleAnswer
                );
                bytes32 proposalId = genericScheme.proposeCall(encodedCall, 0, proposalDescriptionHash);
                emit ProposalCreated(address(genericScheme), proposalId);
            }
            realitio.notifyOfArbitrationRequest(questionId, msg.sender, maxPrevious);
            emit RequestArbitration(questionId, msg.value, msg.sender, 0);
            feeRecipient.transfer(paid);
            emit Withdraw(feeRecipient, paid);
            return true;
        } else {
            emit RequestArbitration(questionId, msg.value, msg.sender, arbitrationFee - paid);
            return false;
        }
    }
}
