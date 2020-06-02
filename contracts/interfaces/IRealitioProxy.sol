pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;


interface IRealitioProxy {
    function getAnswersByQuestionId(bytes32 _questionId) external view returns (string[] memory);

    function getAnswerCountByQuestionId(bytes32 _questionId) external view returns (uint256);

    function getSingleAnswerByQuestionId(bytes32 _questionId, uint256 _arrayPosition)
        external
        view
        returns (string memory);
}
