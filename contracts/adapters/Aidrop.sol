pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "./interfaces/IConfiguration.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeCast.sol";
import "../utils/IERC20.sol";

/**
MIT License
Copyright (c) 2020 Openlaw
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract AirDropContract is DaoConstants, MemberGuard {
    using SafeCast for uint256;

    enum ConfigurationStatus {NOT_CREATED, IN_PROGRESS, DONE}

    /**
     * @dev default fallback function to receive ether sent to the contract
     */
    receive() external payable {}

    function airDrop(
        DaoRegistry dao,
        address payable account,
        address[] calldata receivers,
        address tokenAddr,
        uint256 amount
    ) external {
        require(
            dao.isNotReservedAddress(account),
            "withdraw::reserved address"
        );
        require(balance > 0, "nothing to withdraw");
        dao.withdraw(account, tokenAddr, amount);
        
        if (tokenAddr == ETH_TOKEN) {
            (bool success, ) = address(this).call{value: amount}("");
            require(success, "withdraw failed");
        } else {
            IERC20 erc20 = IERC20(tokenAddr);
            erc20.transferFrom(account, address(this) amount);
        }
        
        for (uint256 i = 0; i < receivers.length; i++) {
            erc20.transfer(receivers, amount.div(receivers.length));
        }
    }
}
