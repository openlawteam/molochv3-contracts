pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "./IExtension.sol";
import "../guards/AdapterGuard.sol";
import "../utils/IERC20.sol";

import "../helpers/AddressLib.sol";
import "../helpers/SafeERC20.sol";

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

contract BankExtension is DaoConstants, AdapterGuard, IExtension {
    using Address for address payable;
    using SafeERC20 for IERC20;

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        ADD_TO_BALANCE,
        SUB_FROM_BALANCE,
        INTERNAL_TRANSFER,
        WITHDRAW,
        EXECUTE,
        REGISTER_NEW_TOKEN,
        REGISTER_NEW_INTERNAL_TOKEN
    }

    /// @dev - Events for Bank
    event NewBalance(address member, address tokenAddr, uint256 amount);

    event Withdraw(address account, address tokenAddr, uint256 amount);

    /*
     * STRUCTURES
     */

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint64 amount;
    }

    address[] public tokens;
    address[] public internalTokens;
    // tokenAddress => availability
    mapping(address => bool) public availableTokens;
    mapping(address => bool) public availableInternalTokens;
    // tokenAddress => memberAddress => checkpointNum => Checkpoint
    mapping(address => mapping(address => mapping(uint32 => Checkpoint)))
        public checkpoints;
    // tokenAddress => memberAddress => numCheckpoints
    mapping(address => mapping(address => uint32)) public numCheckpoints;

    /// @notice Clonable contract must have an empty constructor
    // constructor() {
    // }

    modifier hasExtensionAccess(IExtension extension, AclFlag flag) {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(extension),
                    uint8(flag)
                ),
            "bank::hasAccess"
        );
        _;
    }

    /**
     * @notice Initialises the DAO
     * @dev Involves initialising available tokens, checkpoints, and membership of creator
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     */
    function initialize(DaoRegistry _dao, address creator) external override {
        require(!initialized, "bank already initialized");
        require(_dao.isActiveMember(creator), "bank::not active member");
        availableInternalTokens[SHARES] = true;
        internalTokens.push(SHARES);

        _createNewAmountCheckpoint(creator, SHARES, 1);
        _createNewAmountCheckpoint(TOTAL, SHARES, 1);

        initialized = true;
        dao = _dao;
    }

    function withdraw(
        address payable member,
        address tokenAddr,
        uint256 amount
    ) external hasExtensionAccess(this, AclFlag.WITHDRAW) {
        require(
            balanceOf(member, tokenAddr) >= amount,
            "dao::withdraw::not enough funds"
        );
        subtractFromBalance(member, tokenAddr, amount);
        if (tokenAddr == ETH_TOKEN) {
            member.sendValue(amount);
        } else {
            IERC20 erc20 = IERC20(tokenAddr);
            erc20.safeTransfer(member, amount);
        }

        emit Withdraw(member, tokenAddr, amount);
    }

    /**
     * @return Whether or not the given token is an available internal token in the bank
     * @param token The address of the token to look up
     */
    function isInternalToken(address token) external view returns (bool) {
        return availableInternalTokens[token];
    }

    /**
     * @return Whether or not the given token is an available token in the bank
     * @param token The address of the token to look up
     */
    function isTokenAllowed(address token) public view returns (bool) {
        return availableTokens[token];
    }

    /*
     * BANK
     */

    /**
     * @notice Registers a potential new token in the bank
     * @dev Can not be a reserved token or an available internal token
     * @param token The address of the token
     */
    function registerPotentialNewToken(address token)
        external
        hasExtensionAccess(this, AclFlag.REGISTER_NEW_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!availableInternalTokens[token], "internalToken");

        if (!availableTokens[token]) {
            availableTokens[token] = true;
            tokens.push(token);
        }
    }

    /**
     * @notice Registers a potential new internal token in the bank
     * @dev Can not be a reserved token or an available token
     * @param token The address of the token
     */
    function registerPotentialNewInternalToken(address token)
        external
        hasExtensionAccess(this, AclFlag.REGISTER_NEW_INTERNAL_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!availableTokens[token], "availableToken");
        if (!availableInternalTokens[token]) {
            availableInternalTokens[token] = true;
            internalTokens.push(token);
        }
    }

    function updateToken(address tokenAddr) external {
        require(isTokenAllowed(tokenAddr), "non allowed token");
        uint256 totalBalance = balanceOf(TOTAL, tokenAddr);

        uint256 realBalance;

        if (tokenAddr == ETH_TOKEN) {
            realBalance = address(this).balance;
        } else {
            IERC20 erc20 = IERC20(tokenAddr);
            realBalance = erc20.balanceOf(address(this));
        }

        if (totalBalance < realBalance) {
            addToBalance(GUILD, tokenAddr, realBalance - totalBalance);
        } else if (totalBalance > realBalance) {
            uint256 tokensToRemove = totalBalance - realBalance;
            uint256 guildBalance = balanceOf(GUILD, tokenAddr);
            if (guildBalance > tokensToRemove) {
                subtractFromBalance(GUILD, tokenAddr, tokensToRemove);
            } else {
                subtractFromBalance(GUILD, tokenAddr, guildBalance);
            }
        }
    }

    /**
     * Public read-only functions
     */

    /**
     * @return Whether or not a given address is reserved
     * @dev Returns false if applicant address is one of the constants GUILD or TOTAL
     * @param applicant The address to check
     */
    function isNotReservedAddress(address applicant)
        public
        pure
        returns (bool)
    {
        return applicant != GUILD && applicant != TOTAL;
    }

    /**
     * Internal bookkeeping
     */

    /**
     * @return The token from the bank of a given index
     * @param index The index to look up in the bank's tokens
     */
    function getToken(uint256 index) external view returns (address) {
        return tokens[index];
    }

    /**
     * @return The amount of token addresses in the bank
     */
    function nbTokens() external view returns (uint256) {
        return tokens.length;
    }

    /**
     * @return All the tokens registered in the bank.
     */
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    /**
     * @return The internal token at a given index
     * @param index The index to look up in the bank's array of internal tokens
     */
    function getInternalToken(uint256 index) external view returns (address) {
        return internalTokens[index];
    }

    /**
     * @return The amount of internal token addresses in the bank
     */
    function nbInternalTokens() external view returns (uint256) {
        return internalTokens.length;
    }

    /**
     * @notice Adds to a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function addToBalance(
        address member,
        address token,
        uint256 amount
    ) public payable hasExtensionAccess(this, AclFlag.ADD_TO_BALANCE) {
        require(
            availableTokens[token] || availableInternalTokens[token],
            "unknown token address"
        );
        uint256 newAmount = balanceOf(member, token) + amount;
        uint256 newTotalAmount = balanceOf(TOTAL, token) + amount;

        _createNewAmountCheckpoint(member, token, newAmount);
        _createNewAmountCheckpoint(TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Remove from a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function subtractFromBalance(
        address member,
        address token,
        uint256 amount
    ) public hasExtensionAccess(this, AclFlag.SUB_FROM_BALANCE) {
        uint256 newAmount = balanceOf(member, token) - amount;
        uint256 newTotalAmount = balanceOf(TOTAL, token) - amount;

        _createNewAmountCheckpoint(member, token, newAmount);
        _createNewAmountCheckpoint(TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Make an internal token transfer
     * @param from The member who is sending tokens
     * @param to The member who is receiving tokens
     * @param amount The new amount to transfer
     */
    function internalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) public hasExtensionAccess(this, AclFlag.INTERNAL_TRANSFER) {
        uint256 newAmount = balanceOf(from, token) - amount;
        uint256 newAmount2 = balanceOf(to, token) + amount;

        _createNewAmountCheckpoint(from, token, newAmount);
        _createNewAmountCheckpoint(to, token, newAmount2);
    }

    /**
     * @notice Returns an member's balance of a given token
     * @param member The address to look up
     * @param tokenAddr The token where the member's balance of which will be returned
     * @return The amount in account's tokenAddr balance
     */
    function balanceOf(address member, address tokenAddr)
        public
        view
        returns (uint256)
    {
        uint32 nCheckpoints = numCheckpoints[tokenAddr][member];
        return
            nCheckpoints > 0
                ? checkpoints[tokenAddr][member][nCheckpoints - 1].amount
                : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view returns (uint256) {
        require(
            blockNumber < block.number,
            "Uni::getPriorAmount: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[tokenAddr][account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (
            checkpoints[tokenAddr][account][nCheckpoints - 1].fromBlock <=
            blockNumber
        ) {
            return checkpoints[tokenAddr][account][nCheckpoints - 1].amount;
        }

        // Next check implicit zero balance
        if (checkpoints[tokenAddr][account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[tokenAddr][account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.amount;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[tokenAddr][account][lower].amount;
    }

    /**
     * @notice Creates a new amount checkpoint for a token of a certain member
     * @param member The member whose checkpoints will be added to
     * @param tokenAddr The token of which the balance will be changed
     * @param amount The amount to be written into the new checkpoint
     */
    function _createNewAmountCheckpoint(
        address member,
        address tokenAddr,
        uint256 amount
    ) internal {
        require(
            amount < type(uint64).max,
            "the token amount exceeds the maximum limit"
        );

        uint64 newAmount = uint64(amount);

        uint32 nCheckpoints = numCheckpoints[tokenAddr][member];
        if (
            nCheckpoints > 0 &&
            checkpoints[tokenAddr][member][nCheckpoints - 1].fromBlock ==
            block.number
        ) {
            checkpoints[tokenAddr][member][nCheckpoints - 1].amount = newAmount;
        } else {
            checkpoints[tokenAddr][member][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newAmount
            );
            numCheckpoints[tokenAddr][member] = nCheckpoints + 1;
        }
        emit NewBalance(member, tokenAddr, amount);
    }
}
