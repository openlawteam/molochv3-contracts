pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

interface IDAI {
    function push(address usr, uint wad) external;
    
    function pull(address usr, uint256 wad) external;
    
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
