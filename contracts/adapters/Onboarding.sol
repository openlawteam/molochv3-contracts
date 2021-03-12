pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
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

contract OnboardingContract is
    IOnboarding,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant SharesPerChunk = keccak256("onboarding.sharesPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");
    bytes32 constant MaximumChunks = keccak256("onboarding.maximumChunks");

    struct ProposalDetails {
        bytes32 id;
        address tokenToMint;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        address payable applicant;
        address payable proposer;
    }

    struct OnboardingDetails {
        uint256 chunkSize;
        uint256 numberOfChunks;
        uint256 sharesPerChunk;
        uint256 amount;
        uint256 sharesRequested;
        uint256 totalShares;
    }

    // proposals per dao
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;
    // minted shares per dao, per token, per applicant
    mapping(address => mapping(address => mapping(address => uint256)))
        public shares;

    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(maximumChunks > 0, "maximumChunks must be higher than 0");
        require(chunkSize > 0, "chunkSize must be higher than 0");
        require(sharesPerChunk > 0, "sharesPerChunk must be higher than 0");
        //sharesPerChunk
        dao.setConfiguration(
            configKey(tokenAddrToMint, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(configKey(tokenAddrToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            configKey(tokenAddrToMint, SharesPerChunk),
            sharesPerChunk
        );
        dao.setAddressConfiguration(
            configKey(tokenAddrToMint, TokenAddr),
            tokenAddr
        );

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        bank.registerPotentialNewInternalToken(tokenAddrToMint);
        bank.registerPotentialNewToken(tokenAddr);
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address tokenToMint,
        address payable applicant,
        address payable proposer,
        uint256 value,
        address token
    ) internal returns (uint256) {
        OnboardingDetails memory details;
        details.chunkSize = dao.getConfiguration(
            configKey(tokenToMint, ChunkSize)
        );
        require(details.chunkSize > 0, "config chunkSize missing");

        details.numberOfChunks = value / details.chunkSize;
        require(details.numberOfChunks > 0, "not sufficient funds");

        details.sharesPerChunk = dao.getConfiguration(
            configKey(tokenToMint, SharesPerChunk)
        );
        require(details.sharesPerChunk > 0, "config sharesPerChunk missing");
        details.amount = details.numberOfChunks * details.chunkSize;
        details.sharesRequested =
            details.numberOfChunks *
            details.sharesPerChunk;
        details.totalShares =
            _getShares(dao, token, applicant) +
            details.sharesRequested;

        require(
            details.totalShares / details.sharesPerChunk <
                dao.getConfiguration(configKey(tokenToMint, MaximumChunks)),
            "total shares for this member must be lower than the maximum"
        );

        _submitMembershipProposalInternal(
            dao,
            proposalId,
            tokenToMint,
            applicant,
            proposer,
            details.sharesRequested,
            details.amount,
            token
        );

        return details.amount;
    }

    function onboard(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount
    ) public payable override {
        require(
            dao.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );
        address tokenAddr =
            dao.getAddressConfiguration(configKey(tokenToMint, TokenAddr));
        if (tokenAddr == ETH_TOKEN) {
            // ETH onboarding
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            IERC20 token = IERC20(tokenAddr);
            // ERC20 onboarding
            token.safeTransferFrom(msg.sender, address(this), tokenAmount);
        }

        uint256 amountUsed =
            _submitMembershipProposal(
                dao,
                proposalId,
                tokenToMint,
                applicant,
                payable(msg.sender),
                tokenAmount,
                tokenAddr
            );

        if (amountUsed < tokenAmount) {
            uint256 amount = tokenAmount - amountUsed;
            if (tokenAddr == ETH_TOKEN) {
                payable(msg.sender).sendValue(amount);
            } else {
                IERC20 token = IERC20(tokenAddr);
                token.safeTransfer(msg.sender, amount);
            }
        }
    }

    function updateDelegateKey(DaoRegistry dao, address delegateKey) external {
        dao.updateDelegateKey(msg.sender, delegateKey);
    }

    function _submitMembershipProposalInternal(
        DaoRegistry dao,
        bytes32 proposalId,
        address tokenToMint,
        address payable newMember,
        address payable proposer,
        uint256 sharesRequested,
        uint256 amount,
        address token
    ) internal {
        dao.submitProposal(proposalId);
        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            amount,
            sharesRequested,
            token,
            newMember,
            proposer
        );
    }

    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external override {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );

        _sponsorProposal(dao, proposalId, data, sponsoredBy, votingContract);
    }

    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data,
        address sponsoredBy,
        IVoting votingContract
    ) internal {
        dao.sponsorProposal(proposalId, sponsoredBy);
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");

        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.SPONSORED
            ),
            "proposal already sponsored"
        );

        require(
            proposal.proposer == msg.sender,
            "only proposer can cancel a proposal"
        );

        dao.processProposal(proposalId);

        _refundTribute(proposal.token, proposal.proposer, proposal.amount);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");
        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        IVoting.VotingState voteResult =
            votingContract.voteResult(dao, proposalId);

        dao.processProposal(proposalId);

        if (voteResult == IVoting.VotingState.PASS) {
            address tokenToMint = proposal.tokenToMint;
            address applicant = proposal.applicant;
            BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
            _mintTokensToMember(
                dao,
                tokenToMint,
                applicant,
                proposal.sharesRequested,
                proposal.proposer,
                proposal.token,
                proposal.amount
            );

            address token = proposal.token;
            if (token == ETH_TOKEN) {
                bank.addToBalance{value: proposal.amount}(
                    GUILD,
                    token,
                    proposal.amount
                );
            } else {
                bank.addToBalance(GUILD, token, proposal.amount);

                IERC20 erc20 = IERC20(token);
                erc20.safeTransfer(address(bank), proposal.amount);
            }

            uint256 totalShares =
                _getShares(dao, tokenToMint, applicant) +
                    proposal.sharesRequested;

            shares[address(dao)][tokenToMint][applicant] = totalShares;
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            _refundTribute(proposal.token, proposal.proposer, proposal.amount);
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    function _refundTribute(
        address tokenAddr,
        address payable proposer,
        uint256 amount
    ) internal {
        if (tokenAddr == ETH_TOKEN) {
            proposer.transfer(amount);
        } else {
            IERC20 token = IERC20(tokenAddr);
            token.safeTransfer(proposer, amount);
        }
    }

    function _mintTokensToMember(
        DaoRegistry dao,
        address tokenToMint,
        address memberAddr,
        uint256 tokenAmount,
        address payable proposer,
        address proposalToken,
        uint256 proposalAmount
    ) internal {
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(
            bank.isInternalToken(tokenToMint),
            "it can only mint internal tokens"
        );

        require(
            !dao.getMemberFlag(memberAddr, DaoRegistry.MemberFlag.JAILED),
            "cannot process jailed member"
        );

        dao.potentialNewMember(memberAddr);

        // Overflow risk may cause this to fail in which case the proposal
        // tokens are refunded to the proposer.
        try bank.addToBalance(memberAddr, tokenToMint, tokenAmount) {
            // do nothing
        } catch {
            _refundTribute(proposalToken, proposer, proposalAmount);
        }
    }

    function _getShares(
        DaoRegistry dao,
        address token,
        address applicant
    ) internal view returns (uint256) {
        return shares[address(dao)][token][applicant];
    }
}
