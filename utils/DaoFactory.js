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

const Web3Utils = require("web3-utils");

const sha3 = Web3Utils.sha3;
const toBN = Web3Utils.toBN;
const toWei = Web3Utils.toWei;
const fromUtf8 = Web3Utils.fromUtf8;

const GUILD = "0x000000000000000000000000000000000000dead";
const TOTAL = "0x000000000000000000000000000000000000babe";
const SHARES = "0x00000000000000000000000000000000000FF1CE";
const LOOT = "0x00000000000000000000000000000000B105F00D";
const ETH_TOKEN = "0x0000000000000000000000000000000000000000";
const DAI_TOKEN = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";

const numberOfShares = toBN("1000000000000000");
const sharePrice = toBN(toWei("120", "finney"));
const remaining = sharePrice.sub(toBN("50000000000000"));
const maximumChunks = toBN("11");

const OLToken = artifacts.require("./test/OLToken");
const TestToken1 = artifacts.require("./test/TestToken1");
const TestToken2 = artifacts.require("./test/TestToken2");
const TestFairShareCalc = artifacts.require("./test/TestFairShareCalc");
const Multicall = artifacts.require("./util/Multicall");

const DaoFactory = artifacts.require("./core/DaoFactory");
const DaoRegistry = artifacts.require("./core/DaoRegistry");
const BankExtension = artifacts.require("./extensions/BankExtension");
const BankFactory = artifacts.require("./extensions/BankFactory");
const VotingContract = artifacts.require("./adapters/VotingContract");
const WithdrawContract = artifacts.require("./adapters/WithdrawContract");
const ConfigurationContract = artifacts.require(
  "./adapter/ConfigurationContract"
);
const ManagingContract = artifacts.require("./adapter/ManagingContract");
const FinancingContract = artifacts.require("./adapter/FinancingContract");
const RagequitContract = artifacts.require("./adapters/RagequitContract");
const GuildKickContract = artifacts.require("./adapters/GuildKickContract");
const OnboardingContract = artifacts.require("./adapters/OnboardingContract");

const SnapshotProposalContract = artifacts.require(
  "./adapters/voting/SnapshotProposalContract"
);
const OffchainVotingContract = artifacts.require(
  "./adapters/voting/OffchainVotingContract"
);
const BatchVotingContract = artifacts.require(
  "./adapters/voting/BatchVotingContract"
);
const CouponOnboardingContract = artifacts.require(
  "./adapters/CouponOnboardingContract"
);

const TributeContract = artifacts.require("./adapters/TributeContract");
const DistributeContract = artifacts.require("./adapters/DistributeContract");

async function prepareAdapters(deployer) {
  let voting;
  let configuration;
  let ragequit;
  let managing;
  let financing;
  let onboarding;
  let guildkick;
  let withdraw;
  let couponOnboarding;
  let tribute;
  let distribute;

  if (deployer) {
    await deployer.deploy(VotingContract);
    await deployer.deploy(ConfigurationContract);
    await deployer.deploy(RagequitContract);
    await deployer.deploy(ManagingContract);
    await deployer.deploy(FinancingContract);
    await deployer.deploy(OnboardingContract);
    await deployer.deploy(GuildKickContract);
    await deployer.deploy(WithdrawContract);
    await deployer.deploy(CouponOnboardingContract, 1);
    await deployer.deploy(TributeContract);
    await deployer.deploy(DistributeContract);

    voting = await VotingContract.deployed();
    configuration = await ConfigurationContract.deployed();
    ragequit = await RagequitContract.deployed();
    managing = await ManagingContract.deployed();
    financing = await FinancingContract.deployed();
    onboarding = await OnboardingContract.deployed();
    guildkick = await GuildKickContract.deployed();
    withdraw = await WithdrawContract.deployed();
    couponOnboarding = await CouponOnboardingContract.deployed();
    tribute = await TributeContract.deployed();
    distribute = await DistributeContract.deployed();
  } else {
    voting = await VotingContract.new();
    configuration = await ConfigurationContract.new();
    ragequit = await RagequitContract.new();
    managing = await ManagingContract.new();
    financing = await FinancingContract.new();
    onboarding = await OnboardingContract.new();
    guildkick = await GuildKickContract.new();
    withdraw = await WithdrawContract.new();
    couponOnboarding = await CouponOnboardingContract.new(1);
    tribute = await TributeContract.new();
    distribute = await DistributeContract.new();
  }

  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw,
    couponOnboarding,
    tribute,
    distribute,
  };
}

async function addDefaultAdapters(
  dao,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  maxChunks = maximumChunks,
  daoFactory,
  deployer
) {
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw,
    couponOnboarding,
    tribute,
    distribute,
  } = await prepareAdapters(deployer);
  await configureDao(
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw,
    voting,
    configuration,
    couponOnboarding,
    tribute,
    distribute,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks
  );

  return { dao };
}

async function configureDao(
  daoFactory,
  dao,
  ragequit,
  guildkick,
  managing,
  financing,
  onboarding,
  withdraw,
  voting,
  configuration,
  couponOnboarding,
  tribute,
  distribute,
  unitPrice,
  nbShares,
  votingPeriod,
  gracePeriod,
  tokenAddr,
  maxChunks
) {
  await daoFactory.addAdapters(dao.address, [
    entryDao("voting", voting, {}),
    entryDao("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entryDao("ragequit", ragequit, {
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
    }),
    entryDao("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
    }),
    entryDao("managing", managing, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REMOVE_ADAPTER: true,
      ADD_ADAPTER: true,
    }),
    entryDao("financing", financing, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
    }),
    entryDao("onboarding", onboarding, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true,
    }),
    entryDao("coupon-onboarding", couponOnboarding, {
      SUBMIT_PROPOSAL: false,
      SPONSOR_PROPOSAL: false,
      PROCESS_PROPOSAL: false,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: false,
      NEW_MEMBER: true,
    }),
    entryDao("withdraw", withdraw, {}),
    entryDao("tribute", tribute, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      NEW_MEMBER: true,
    }),
    entryDao("distribute", distribute, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
    }),
  ]);

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bank = await BankExtension.at(bankAddress);

  await daoFactory.configureExtension(dao.address, bank.address, [
    entryBank(ragequit, {
      WITHDRAW: true,
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(guildkick, {
      WITHDRAW: true,
      INTERNAL_TRANSFER: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
    }),
    entryBank(withdraw, {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(onboarding, {
      ADD_TO_BALANCE: true,
    }),
    entryBank(couponOnboarding, {
      ADD_TO_BALANCE: true,
    }),
    entryBank(financing, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryBank(tribute, {
      ADD_TO_BALANCE: true,
      REGISTER_NEW_TOKEN: true,
    }),
    entryBank(distribute, {
      INTERNAL_TRANSFER: true,
    }),
  ]);

  await onboarding.configureDao(
    dao.address,
    SHARES,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );

  await onboarding.configureDao(
    dao.address,
    LOOT,
    unitPrice,
    nbShares,
    maxChunks,
    tokenAddr
  );
  await couponOnboarding.configureDao(
    dao.address,
    "0x7D8cad0bbD68deb352C33e80fccd4D8e88b4aBb8",
    SHARES
  );

  await voting.configureDao(dao.address, votingPeriod, gracePeriod);
  await tribute.configureDao(dao.address, SHARES);
  await tribute.configureDao(dao.address, LOOT);
}

async function deployDao(deployer, options) {
  const unitPrice = options.unitPrice || sharePrice;
  const nbShares = options.nbShares || numberOfShares;
  const votingPeriod = options.votingPeriod || 10;
  const gracePeriod = options.gracePeriod || 1;
  const tokenAddr = options.tokenAddr || ETH_TOKEN;
  const maxChunks = options.maximumChunks || maximumChunks;
  const isOffchainVoting = !!options.offchainVoting;
  const chainId = options.chainId || 1;
  const deployTestTokens = !!options.deployTestTokens;

  await deployer.deploy(DaoRegistry);

  const { dao, daoFactory } = await cloneDaoDeployer(deployer);

  await deployer.deploy(BankExtension);
  const identityBank = await BankExtension.deployed();

  await deployer.deploy(BankFactory, identityBank.address);
  const bankFactory = await BankFactory.deployed();

  await bankFactory.createBank();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }

  let { bankAddress } = pastEvent.returnValues;
  let bank = await BankExtension.at(bankAddress);
  let creator = await dao.getMemberAddress(1);

  dao.addExtension(sha3("bank"), bank.address, creator);

  await addDefaultAdapters(
    dao,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks,
    daoFactory,
    deployer
  );

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  if (isOffchainVoting) {
    await deployer.deploy(SnapshotProposalContract, chainId);
    const snapshotProposalContract = await SnapshotProposalContract.deployed();
    const offchainVoting = await deployer.deploy(
      OffchainVotingContract,
      votingAddress,
      snapshotProposalContract.address
    );
    await daoFactory.updateAdapter(
      dao.address,
      entryDao("voting", offchainVoting, {})
    );

    await dao.setAclToExtensionForAdapter(
      bankAddress,
      offchainVoting.address,
      entryBank(offchainVoting, {
        ADD_TO_BALANCE: true,
        SUB_FROM_BALANCE: true,
        INTERNAL_TRANSFER: true,
      }).flags
    );

    await offchainVoting.configureDao(
      dao.address,
      votingPeriod,
      gracePeriod,
      10
    );
  }

  // deploy test token contracts (for testing convenience)
  if (deployTestTokens) {
    await deployer.deploy(OLToken, toBN("1000000000000000000000000"));
    await deployer.deploy(TestToken1, 1000000);
    await deployer.deploy(TestToken2, 1000000);
    await deployer.deploy(Multicall);
  }

  return dao;
}

let counter = 0;

async function createDao(
  senderAccount,
  unitPrice = sharePrice,
  nbShares = numberOfShares,
  votingPeriod = 10,
  gracePeriod = 1,
  tokenAddr = ETH_TOKEN,
  finalize = true,
  maxChunks = maximumChunks
) {
  const bankFactory = await BankFactory.deployed();
  const daoFactory = await DaoFactory.deployed();
  const daoName = "test-dao-" + counter++;
  await daoFactory.createDao(daoName, senderAccount);

  // checking the gas usaged to clone a contract
  const daoAddress = await daoFactory.getDaoAddress(daoName);

  let dao = await DaoRegistry.at(daoAddress);

  await bankFactory.createBank();

  let pastEvents = await bankFactory.getPastEvents();
  let { bankAddress } = pastEvents[0].returnValues;
  let bank = await BankExtension.at(bankAddress);

  dao.addExtension(sha3("bank"), bank.address, senderAccount);

  const voting = await VotingContract.deployed();
  const configuration = await ConfigurationContract.deployed();
  const ragequit = await RagequitContract.deployed();
  const managing = await ManagingContract.deployed();
  const financing = await FinancingContract.deployed();
  const onboarding = await OnboardingContract.deployed();
  const guildkick = await GuildKickContract.deployed();
  const withdraw = await WithdrawContract.deployed();
  const couponOnboarding = await CouponOnboardingContract.deployed();
  const tribute = await TributeContract.deployed();
  const distribute = await DistributeContract.deployed();

  await configureDao(
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    withdraw,
    voting,
    configuration,
    couponOnboarding,
    tribute,
    distribute,
    unitPrice,
    nbShares,
    votingPeriod,
    gracePeriod,
    tokenAddr,
    maxChunks
  );

  if (finalize) {
    await dao.finalizeDao();
  }

  return dao;
}

async function cloneDao(identityAddress, senderAccount) {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  let daoFactory = await DaoFactory.new(identityAddress);
  await daoFactory.createDao("test-dao", senderAccount);
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address } = pastEvents[0].returnValues;

  let dao = await DaoRegistry.at(_address);

  return { dao, daoFactory };
}

async function cloneDaoDeployer(deployer) {
  // newDao: uses clone factory to clone the contract deployed at the identityAddress
  const dao = await DaoRegistry.deployed();
  await deployer.deploy(DaoFactory, dao.address);
  let daoFactory = await DaoFactory.deployed();

  await daoFactory.createDao("test-dao", ETH_TOKEN);
  // checking the gas usaged to clone a contract
  let pastEvents = await daoFactory.getPastEvents();
  let { _address } = pastEvents[0].returnValues;
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory };
}

async function advanceTime(time) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });

  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });
}

function entryBank(contract, flags) {
  const values = [
    flags.ADD_TO_BALANCE,
    flags.SUB_FROM_BALANCE,
    flags.INTERNAL_TRANSFER,
    flags.WITHDRAW,
    flags.EXECUTE,
    flags.REGISTER_NEW_TOKEN,
    flags.REGISTER_NEW_INTERNAL_TOKEN,
  ];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
}

function entryDao(name, contract, flags) {
  const values = [
    flags.ADD_ADAPTER,
    flags.REMOVE_ADAPTER,
    flags.JAIL_MEMBER,
    flags.UNJAIL_MEMBER,
    flags.SUBMIT_PROPOSAL,
    flags.SPONSOR_PROPOSAL,
    flags.PROCESS_PROPOSAL,
    flags.UPDATE_DELEGATE_KEY,
    flags.SET_CONFIGURATION,
    flags.ADD_EXTENSION,
    flags.REMOVE_EXTENSION,
    flags.NEW_MEMBER,
  ];

  const acl = entry(values);

  return {
    id: sha3(name),
    addr: contract.address,
    flags: acl,
  };
}

function entry(values) {
  return values
    .map((v, idx) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
}

async function advanceTime(time) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });

  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });
}

async function getContract(dao, id, contractFactory) {
  const address = await dao.getAdapterAddress(sha3(id));
  return await contractFactory.at(address);
}

module.exports = {
  prepareAdapters,
  advanceTime,
  createDao,
  deployDao,
  addDefaultAdapters,
  getContract,
  entry,
  entryBank,
  entryDao,
  sha3,
  toBN,
  toWei,
  fromUtf8,
  maximumChunks,
  GUILD,
  TOTAL,
  DAI_TOKEN,
  SHARES,
  LOOT,
  numberOfShares,
  sharePrice,
  remaining,
  ETH_TOKEN,
  OLToken,
  TestToken1,
  TestToken2,
  TestFairShareCalc,
  DaoFactory,
  DaoRegistry,
  VotingContract,
  ManagingContract,
  FinancingContract,
  RagequitContract,
  GuildKickContract,
  OnboardingContract,
  WithdrawContract,
  ConfigurationContract,
  OffchainVotingContract,
  SnapshotProposalContract,
  BatchVotingContract,
  TributeContract,
  DistributeContract,
  BankExtension,
  OnboardingContract,
  CouponOnboardingContract,
};
