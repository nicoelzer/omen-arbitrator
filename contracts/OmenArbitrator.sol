pragma solidity ^0.5.0;

import "./interfaces/IRealitio.sol";
import "./interfaces/IGenericScheme.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract OmenArbitrator is Ownable{
  using SafeMath for uint;

  IRealitio public realitio;

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

  /** @dev Event emitted when the corresponding Realitio contract address is changed. */
  event SetRealitio(address realitio);

  /** @dev Event emitted when the Avatar contract address is changed. */
  event SetDAOstackAvatar(address avatar);

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
  event Withdraw(address payable recipient, uint amount);

  /** @dev Owner facing function used to change the realitio contract address it's interacting with.
    * @param _address address of coresponding realitio contract
    * Emits an {SetRealitio} event.
    */
  function setRealitio(address _address) 
    onlyOwner()
    public {
      realitio = IRealitio(_address);
      emit SetRealitio(_address);
  }

  /** @dev Owner facing function used to change the address of the DAOstack Alchemy Generic Scheme address
    * @param _address address of coresponding DAOstack Plugiin
    * Emits an {SetDAOstackPlugin} event.
    */
  function setDAOstackPlugin(address _address) 
    onlyOwner()
    public {
      genericScheme = IGenericScheme(_address);
      emit SetDAOstackPlugin(_address);
  }

  /** @dev Owner facing function used to change the address of the DAOstack Avatar address
    * @param _DAOstackAvatar address of coresponding DAOstack Plugiin
    * Emits an {SetDAOstackAvatar} event.
    */
  function setDAOstackAvatar(address _DAOstackAvatar) 
    onlyOwner()
    public {
      DAOstackAvatar = _DAOstackAvatar;
      emit SetDAOstackAvatar(_DAOstackAvatar);
  }

  /** @dev Owner facing function used to change the DescriptionHash for the DAOstack Proposal
    * @param _descriptionHash String of descriptionHash
    */
  function setDAOstackProposalDescriptionHash(string memory _descriptionHash) 
    onlyOwner()
    public {
      proposalDescriptionHash = _descriptionHash;
  }

  /** @dev Owner facing function used to change metadata used by realitio dApp.
    * Set a metadata string, expected to be JSON, containing things like arbitrator TOS address
    * @param _metadata JSON metadata string
    * Emits an {SetMetaData} event.
    */
  function setMetaData(string memory _metadata) 
    onlyOwner()
    public {
      metadata = _metadata;
      emit SetMetaData(_metadata);
  }

  /** @dev Owner facing function used to modify the fee to be charged.
    * @param _fee amount in ETH to be charged.
    * Emits an {SetDisputeFee} event.
    */
  function setDisputeFee(uint256 _fee) 
    onlyOwner()
    public {
      disputeFee = _fee;
      emit SetDisputeFee(_fee);
  }

  /** @dev Owner facing function used to change the recipient that receives the charged fees.
    * @param _recipient address of receiver.
    * Emits an {SetFeeRecipient} event.
    */
  function setFeeRecipient(address payable _recipient) 
    onlyOwner()
    public {
      feeRecipient = _recipient;
      emit SetFeeRecipient(_recipient);
  }

  /** @dev Submit the abitrators's answer to a question.
    * @param questionId realitio questionId for reference.
    * @param answer hashed final answer.
    * @param answerer address of answerer. If arbitration changed the answer, it should be the payer. If not, the old answerer.
    * Emits an {submitAnswerByArbitrator} event.
    */
  function submitAnswerByArbitrator(bytes32 questionId, bytes32 answer, address answerer) 
    onlyOwner()
    public {
    delete arbitrationFees[questionId];
    realitio.submitAnswerByArbitrator(questionId,answer,answerer);
    emit SubmitAnswerByArbitrator(questionId,answer,answerer);
  }

  /** @dev Submit the abitrators's answer to a question.
    * @param questionId realitio questionId for reference.
    * @return the fee in ETH to charged by abitrator.
    */
  function getDisputeFee(bytes32 questionId) public view returns (uint256){
    return disputeFee;
  }

  /** @dev Called by realitio to request abitration. Question on realitio will be freezed until answered is provided by submitAnswerByArbitrator()
    * @param questionId realitio questionId for reference.
    * @param maxPrevious If specified, reverts if a bond higher than this was submitted after you sent your transaction.
    * Emits an {RequestArbitration} event.
    */
  function requestArbitration(bytes32 questionId, uint256 maxPrevious) external payable returns (bool){

    uint256 arbitrationFee = getDisputeFee(questionId);
    require(arbitrationFee > 0, "The arbitrator must have set a non-zero fee for the question");

    disputeQuestionId[disputeCount] = questionId;
    arbitrationFees[questionId] = arbitrationFees[questionId].add(msg.value);
    uint256 paid = arbitrationFees[questionId];
    disputeCount++;
    
    if (paid >= arbitrationFee) {
        withdraw(arbitrationFees[questionId]);
        emit Withdraw(feeRecipient, arbitrationFees[questionId]);
        bytes memory encodedCall = abi.encodeWithSelector(bytes4(keccak256("disputeRequestNotification(bytes32)")), questionId);
        genericScheme.proposeCall(DAOstackAvatar,encodedCall,0,proposalDescriptionHash);
        realitio.notifyOfArbitrationRequest(questionId, msg.sender, maxPrevious);
        emit RequestArbitration(questionId, msg.value, msg.sender, 0);
        return true;
    } else {
        require(!realitio.isFinalized(questionId), "The question must not have been finalized");
        emit RequestArbitration(questionId, msg.value, msg.sender, arbitrationFee - paid);
        return false;
    }
    return true;
  }

  /** @dev Internal function to withdraw fees and transfer to defined fee recipient.
    * @param _amount amount to be transfered
    * @return the fee in ETH to charged by abitrator.
    */
  function withdraw(uint _amount) 
  internal {
    feeRecipient.transfer(_amount); 
    emit Withdraw(feeRecipient, _amount);
  }

}