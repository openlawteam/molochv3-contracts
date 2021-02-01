// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IAaveDepositWithdraw {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address token, uint256 amount, address destination) external;
    function getReservesList() external view returns (address[] memory);
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
