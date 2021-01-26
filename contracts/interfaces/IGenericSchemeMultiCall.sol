// SPDX-License-Identifier: LGPL-3.0-or-newer
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

interface IGenericSchemeMultiCall {
    function proposeCalls(
        address[] calldata _contractsToCall,
        bytes[] calldata _callsData,
        uint256[] calldata _values,
        string calldata _descriptionHash
    ) external returns (bytes32);
}
