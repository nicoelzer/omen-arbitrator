pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;

import './interfaces/IRealitio.sol';
import '@openzeppelin/contracts/access/Ownable.sol';


contract RealitioProxy is Ownable {
    IRealitio public realitio;

    /** @dev Array of possible answers of a given question */
    mapping(bytes32 => string[]) public questionAnswers;

    /** @dev Allows to turn on on-chain storage of question answers for a given arbitrator address */
    mapping(address => bool) public arbitratorAnswerStorage;

    /** @dev Event emitted when the corresponding Realitio contract address is changed. */
    event SetRealitio(address realitio);

    /** @dev Event emitted when on-chain storage for a given arbitrator is turned on */
    event ActivateAnswerStorage(address arbitrator);

    /** @dev Event emitted when on-chain storage for a given arbitrator is turned off */
    event DeactivateAnswerStorage(address arbitrator);

    /** @dev Event emitted when a new Question was created. */
    event LogNewQuestion(
        bytes32 indexed question_id,
        address indexed user,
        uint256 template_id,
        string question,
        bytes32 indexed content_hash,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 created
    );

    /** @dev Event emitted when a new Question was created and on-chain storage is activated */
    event StoreNewQuestionAnswers(bytes32 indexed question_id);

    /** @dev Owner facing function used to change the realitio contract address it's interacting with.
     * @param _address address of coresponding realitio contract
     * Emits an {SetRealitio} event.
     */
    function setRealitio(address _address) public onlyOwner() {
        realitio = IRealitio(_address);
        emit SetRealitio(_address);
    }

    /** @dev Owner facing function to turn on on-chain storage of anwers for a given arbitrator
     * @param _arbitrator address of coresponding arbitrator contract
     * Emits an {ActivateAnswerStorage} event.
     */
    function activateAnswerStorage(address _arbitrator) public onlyOwner() {
        require(arbitratorAnswerStorage[_arbitrator] != true, 'RealitioProxy: ACTIVE_STORAGE');
        arbitratorAnswerStorage[_arbitrator] = true;
        emit ActivateAnswerStorage(_arbitrator);
    }

    /** @dev Owner facing function to turn off on-chain storage of anwers for a given arbitrator
     * @param _arbitrator address of coresponding arbitrator contract
     * Emits an {DeactivateAnswerStorage} event.
     */
    function deactivateAnswerStorage(address _arbitrator) public onlyOwner() {
        require(arbitratorAnswerStorage[_arbitrator] == true, 'RealitioProxy: INACTIVE_STORAGE');
        arbitratorAnswerStorage[_arbitrator] = false;
        emit DeactivateAnswerStorage(_arbitrator);
    }

    /** @dev get all possible answers for a given questionId
     * @param _questionId coresponding questionId
     */
    function getAnswersByQuestionId(bytes32 _questionId) public view returns (string[] memory) {
        return questionAnswers[_questionId];
    }

    /** @dev get the number of answers for a given questionId
     * @param _questionId coresponding questionId
     */
    function getAnswerCountByQuestionId(bytes32 _questionId) public view returns (uint256) {
        return questionAnswers[_questionId].length;
    }

    /** @dev get a single answer from a given questionId
     * @param _questionId coresponding questionId
     * @param _arrayPosition position in the array to return value form
     */
    function getSingleAnswerByQuestionId(bytes32 _questionId, uint256 _arrayPosition)
        public
        view
        returns (string memory)
    {
        return questionAnswers[_questionId][_arrayPosition];
    }

    /** @dev returns if a question is finalized or not
     * @param _questionId coresponding questionId
     */
    function isFinalized(bytes32 _questionId) public view returns (bool) {
        require(address(realitio) != address(0), 'RealitioProxy: NO_REALITIO_ADDRESS');
        return realitio.isFinalized(_questionId);
    }

    /** @dev returns the result for a given question not
     * @param _questionId coresponding questionId
     */
    function resultFor(bytes32 _questionId) public view returns (bytes32) {
        require(address(realitio) != address(0), 'RealitioProxy: NO_REALITIO_ADDRESS');
        return realitio.resultFor(_questionId);
    }

    /** @dev proxy function between Omen and realitio that stores question answers on-chain when the option has been turned on for a given arbitrator
     * @param template_id value will be used to create the question on realitio
     * @param question value will be used to create the question on realitio
     * @param arbitrator value will be used to create the question on realitio and determine if the answers will be stored on-chain
     * @param timeout value will be used to create the question on realitio
     * @param opening_ts value will be used to create the question on realitio
     * @param nonce value will be used to create the question on realitio
     * @param _answers array of possible answers that will be stored on-chain when option is activated for given arbitrator
     * Emits an {LogNewQuestion} event.
     */
    function askQuestion(
        uint256 template_id,
        string memory question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        string[] memory _answers
    ) public payable returns (bytes32) {
        require(address(realitio) != address(0), 'RealitioProxy: NO_REALITIO_ADDRESS');
        bytes32 content_hash = keccak256(abi.encodePacked(template_id, opening_ts, question));
        bytes32 realitioQuestionId = realitio.askQuestion(
            template_id,
            question,
            arbitrator,
            timeout,
            opening_ts,
            nonce
        );
        if (arbitratorAnswerStorage[arbitrator] == true) {
            emit StoreNewQuestionAnswers(realitioQuestionId);
            for (uint32 i = 0; i < _answers.length; i++) {
                questionAnswers[realitioQuestionId].push(_answers[i]);
            }
        }
        emit LogNewQuestion(
            realitioQuestionId,
            address(this),
            template_id,
            question,
            content_hash,
            arbitrator,
            timeout,
            opening_ts,
            nonce,
            now
        );
        return realitioQuestionId;
    }
}
