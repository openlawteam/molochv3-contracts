pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

interface Dai {
    function pull(address usr, uint256 wad) external;

    function approve(address usr, uint256 wad) external returns (bool);

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
