interface GetYAMLType {
  daoFactoryAddress: string;
  bankFactoryAddress: string;
}

export const getYAML = ({
  daoFactoryAddress,
  bankFactoryAddress,
}: GetYAMLType): string => {
  return ` 
specVersion: 0.0.2
description: Molochv3 Subgraph
repository: https://github.com/openlawteam/molochv3-contracts
schema:
  file: ./schema.graphql
dataSources:
  # ====================================== DaoFactory ====================================
  - kind: ethereum/contract
    name: DaoFactory
    network: mainnet
    source:
      address: "${daoFactoryAddress}"
      abi: DaoFactory
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      entities:
        - Molochv3
      abis:
        - name: DaoFactory
          file: ./build/contracts/DaoFactory.json
      eventHandlers:
        - event: DAOCreated(address,string)
          handler: handleDaoCreated
      file: ./src/dao-factory-mapping.ts
  # ====================================== BankFactory ====================================
  - kind: ethereum/contract
    name: BankFactory
    network: rinkeby
    source:
      address: "${bankFactoryAddress}"
      abi: BankFactory
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      entities:
        - Bank
      abis:
        - name: BankFactory
          file: ./build/contracts/BankFactory.json
      eventHandlers:
        - event: BankCreated(address)
          handler: handleBankCreated
      file: ./src/bank-factory-mapping.ts

templates:
  # ====================================== DaoRegistry ====================================
  - kind: ethereum/contract
    name: DaoRegistry
    network: mainnet
    source:
      abi: DaoRegistry
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      entities:
        - Proposal
        - Member
        - Adapter
        - Extension
      abis:
        - name: DaoRegistry
          file: ./build/contracts/DaoRegistry.json
        - name: OnboardingContract
          file: ./build/contracts/OnboardingContract.json
        - name: DistributeContract
          file: ./build/contracts/DistributeContract.json
        - name: TributeContract
          file: ./build/contracts/TributeContract.json
        - name: ManagingContract
          file: ./build/contracts/ManagingContract.json
        - name: GuildKickContract
          file: ./build/contracts/GuildKickContract.json
        - name: FinancingContract
          file: ./build/contracts/FinancingContract.json
      eventHandlers:
        - event: SubmittedProposal(bytes32,uint256)
          handler: handleSubmittedProposal
        - event: SponsoredProposal(bytes32,uint256)
          handler: handleSponsoredProposal
        - event: ProcessedProposal(bytes32,uint256)
          handler: handleProcessedProposal
        - event: AdapterAdded(bytes32,address,uint256)
          handler: handleAdapterAdded
        - event: AdapterRemoved(bytes32)
          handler: handleAdapterRemoved
        - event: ExtensionAdded(bytes32,address)
          handler: handleExtensionAdded
        - event: ExtensionRemoved(bytes32)
          handler: handleExtensionRemoved
        - event: UpdateDelegateKey(address,address)
          handler: handleUpdateDelegateKey
        - event: MemberJailed(address)
          handler: handleMemberJailed
        - event: MemberUnjailed(address)
          handler: handleMemberUnjailed
        - event: ConfigurationUpdated(bytes32,uint256)
          handler: handleConfigurationUpdated
        - event: AddressConfigurationUpdated(bytes32,address)
          handler: handleAddressConfigurationUpdated
      file: ./src/dao-registry-mapping.ts
  # ====================================== BankExtension ====================================
  - kind: ethereum/contract
    name: BankExtension
    network: mainnet
    source:
      abi: BankExtension
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.4
      language: wasm/assemblyscript
      entities:
        - TokenBalance
        - Token
        - Member
      abis:
        - name: BankExtension
          file: ./build/contracts/BankExtension.json
      eventHandlers:
        - event: NewBalance(address,address,uint256)
          handler: handleNewBalance
        - event: Withdraw(address,address,uint256)
          handler: handleWithdraw
      file: ./src/bank-extension-mapping.ts

          
`;
};