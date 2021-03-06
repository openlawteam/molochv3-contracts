// Whole-script strict mode syntax
"use strict";

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
const {
  sha3,
  toBN,
  advanceTime,
  createDao,
  entryDao,
  ETH_TOKEN,
  GUILD,
  TOTAL,
  ManagingContract,
  VotingContract,
  OnboardingContract,
  OffchainVotingContract,
  sharePrice,
  numberOfShares,
} = require("../../utils/DaoFactory.js");

contract("MolochV3 - Managing Adapter", async (accounts) => {
  it("should not be possible to propose a new adapter when the adapter has a reserved address", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("bank");
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);
    try {
      await managing.createAdapterChangeRequest(
        dao.address,
        "0x1",
        newAdapterId,
        GUILD,
        [],
        [],
        0,
        { from: myAccount, gasPrice: toBN("0") }
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "adapter address is reserved address");
    }

    try {
      await managing.createAdapterChangeRequest(
        dao.address,
        "0x0",
        newAdapterId,
        TOTAL,
        [],
        [],
        0,
        { from: myAccount, gasPrice: toBN("0") }
      );
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "adapter address is reserved address");
    }
  });

  it("passing 0x0 as the new adapter address should remove the adapter", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    await managing.createAdapterChangeRequest(
      dao.address,
      "0x45",
      newAdapterId,
      "0x0000000000000000000000000000000000000000",
      [],
      [],
      0,
      {
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    managing.spon;

    try {
      dao.getAdapterAddress(sha3("onboarding"));
    } catch (ex) {}
  });

  it("passing 0x0 as the new adapter address means you delete it", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");

    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    let proposalId = "0x44";
    await managing.createAdapterChangeRequest(
      dao.address,
      proposalId,
      newAdapterId,
      "0x0000000000000000000000000000000000000000",
      [],
      [],
      0,
      {
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);

    await managing.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    proposalId = "0x45";
    newAdapterId = sha3("not_an_adapter");
    await managing.createAdapterChangeRequest(
      dao.address,
      proposalId,
      newAdapterId,
      "0x0000000000000000000000000000000000000000",
      [],
      [],
      0,
      {
        from: myAccount,
        gasPrice: toBN("0"),
      }
    );

    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    try {
      await managing.processProposal(dao.address, proposalId, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
    } catch (ex) {
      assert.equal(err.reason, "onlyMember");
    }
  });

  it("should be possible to any individual to propose a new DAO adapter", async () => {
    const myAccount = accounts[1];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    //Submit a new Bank adapter proposal
    let newAdapterId = sha3("onboarding");
    let proposalId = "0x1";
    let newAdapterAddress = accounts[3];
    await managing.createAdapterChangeRequest(
      dao.address,
      proposalId,
      newAdapterId,
      newAdapterAddress,
      [],
      [],
      0,
      { from: myAccount, gasPrice: toBN("0") }
    );

    //Sponsor the new proposal, vote and process it
    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: myAccount,
      gasPrice: toBN("0"),
    });
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Check if the Bank Adapter was added to the Registry
    let newBankAddress = await dao.getAdapterAddress(sha3("onboarding"));
    assert.equal(newBankAddress.toString(), newAdapterAddress.toString());
  });

  it("should be possible to propose a new DAO adapter with a delegate key", async () => {
    const myAccount = accounts[1];
    const delegateKey = accounts[3];

    //Create the new DAO
    let dao = await createDao(myAccount);
    let managingContract = await dao.getAdapterAddress(sha3("managing"));
    let managing = await ManagingContract.at(managingContract);

    let votingContract = await dao.getAdapterAddress(sha3("voting"));
    let voting = await VotingContract.at(votingContract);

    let proposalId = "0x1";

    //Submit a new onboarding adapter proposal
    let newAdapterId = sha3("onboarding");
    let newAdapterAddress = accounts[4];
    await managing.createAdapterChangeRequest(
      dao.address,
      proposalId,
      newAdapterId,
      newAdapterAddress,
      [],
      [],
      0,
      { from: myAccount, gasPrice: toBN("0") }
    );

    //set new delegate key
    const onboardingAddr = await dao.getAdapterAddress(sha3("onboarding"));
    const onboarding = await OnboardingContract.at(onboardingAddr);
    await onboarding.updateDelegateKey(dao.address, delegateKey, {
      from: myAccount,
      gasPrice: toBN("0"),
    });

    //Sponsor the new proposal, vote and process it
    await managing.sponsorProposal(dao.address, proposalId, [], {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    await voting.submitVote(dao.address, proposalId, 1, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });
    try {
      await voting.submitVote(dao.address, proposalId, 1, {
        from: myAccount,
        gasPrice: toBN("0"),
      });
      assert.err("should not pass");
    } catch (err) {
      assert.equal(err.reason, "onlyMember");
    }
    await advanceTime(10000);
    await managing.processProposal(dao.address, proposalId, {
      from: delegateKey,
      gasPrice: toBN("0"),
    });

    //Check if the onboarding adapter was added to the Registry
    let newOnboardingAddress = await dao.getAdapterAddress(sha3("onboarding"));
    assert.equal(newOnboardingAddress.toString(), newAdapterAddress.toString());
  });
});
