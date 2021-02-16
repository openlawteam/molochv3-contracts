pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

/**
 * The TestChainlink contract does this and that...
 */
contract TestChainlink {
  constructor() public {
    string = "TestChainlink";
  }

  function latestRoundData () 
  external view returns (
  	  uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
  )
  {
  	uint80 roundId = 0; 
  	int256 answer = 176471000000; 
  	uint256 startedAt = 0; 
  	uint256 updatedAt = 0; 
  	uint80 answeredInRound = 0; 
  }

}
