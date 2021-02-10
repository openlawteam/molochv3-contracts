pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

//interace for Chainlink Financing is same as IFinancing.sol
import "./interfaces/IFinancing.sol"; 
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../extensions/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
//need these?
// import "../guards/AdapterGuard.sol";
// import "../utils/IERC20.sol";
// import "../helpers/AddressLib.sol";
// import "../helpers/SafeERC20.sol";

//import Chainlink Aggregator
import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

/*
	OVERVIEW: Financing Requests in USD

	Request Amount in USD and receive a corresponding amount in ETH once proposal is processed. 
	use Chainlink ETH/USD conversion at processProposal 
	ProposalDetails.amount - has to be converted at processPropsal from USD to ETH
*/
contract ChainlinkFinancing {

	 AggregatorV3Interface internal priceFeed;

    /**
     * Network: Rinkeby
     * Aggregator: ETH/USD
     * Address: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
     */

  constructor() public {
    priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
  }

  	using Address for address;
   	using SafeERC20 for IERC20;

	mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    struct ProposalDetails {
        address applicant; // the proposal applicant address, can not be a reserved address
        uint256 amount; // the amount requested for funding
        address token; // the token address in which the funding must be sent to
        bytes32 details; // additional details about the financing proposal
    }

     /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable {
        revert("fallback revert");
    }

     /**
     * @notice Creates a financing proposal.
     * @dev Applicant address must not be reserved.
     * @dev Token address must be allowed/supported by the DAO Bank.
     * @dev Requested amount must be greater than zero.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param applicant The applicant address.
     * @param token The token to receive the funds.
     * @param amount The desired amount.
     * @param details Additional detais about the financing proposal.
     */
    function createFinancingRequest(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address token, //hardcode to WETH? or ETH
        uint256 amount, //in USD
        bytes32 details
    ) external override {
        require(amount > 0, "invalid requested amount");
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.isTokenAllowed(token), "token not allowed");
        require(
            dao.isNotReservedAddress(applicant),
            "applicant using reserved address"
        );
        dao.submitProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.token = token;
    }

    /**
     * @notice Sponsor a financing proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a financing proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param data Additional details about the sponsorship process.
     */
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

    /**
     * @notice Sponsors a financing proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a financing proposal.
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     * @param data Additional details about the sponsorship process.
     * @param sponsoredBy The address of the sponsoring member.
     * @param votingContract The voting contract used by the DAO.
     */
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

    /**
     * @notice Processing a financing proposal to grant the requested funds.
     * @dev Only proposals that were not processed are accepted.
     * @dev Only proposals that were sponsored are accepted.
     * @dev Only proposals that passed can get processed and have the funds released.
     * @dev proposals are requested in US dollars and paid out in ETH, conversion is done though Chainlink
     * @param dao The DAO Address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
    {
        ProposalDetails memory details = proposals[address(dao)][proposalId];

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) ==
                IVoting.VotingState.PASS,
            "proposal needs to pass"
        );
        dao.processProposal(proposalId);
        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

        /*
			call Chainlink ETH/USD feed with getLatestPrice(). 
			explicit convert from int to uint256
			denominator *  100000  = convert denominator to wei
			details.amount * 1000000000000000000000 = convert numerator to wei.

        */
        uint denominator = uint(getLatestPrice()); 
        uint256 ethInUsdAmount = details.amount * 1000000000000000000000/denominator * 100000; 
        //use ethInUsdAmount iinstead of details.amount
        bank.subtractFromBalance(GUILD, details.token, ethInUsdAmount);
        bank.addToBalance(details.applicant, details.token, ethInUsdAmount);
    } //process

     /**
     * 
     Chainlink
     Returns the latest price to 5 decimials 
     e.g. 176471000000 = $1,764.71
     */
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}//end of K 
