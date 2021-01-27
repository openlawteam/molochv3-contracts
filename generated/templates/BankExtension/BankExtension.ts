// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class NewBalance extends ethereum.Event {
  get params(): NewBalance__Params {
    return new NewBalance__Params(this);
  }
}

export class NewBalance__Params {
  _event: NewBalance;

  constructor(event: NewBalance) {
    this._event = event;
  }

  get member(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get tokenAddr(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Withdraw extends ethereum.Event {
  get params(): Withdraw__Params {
    return new Withdraw__Params(this);
  }
}

export class Withdraw__Params {
  _event: Withdraw;

  constructor(event: Withdraw) {
    this._event = event;
  }

  get account(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get tokenAddr(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class BankExtension__checkpointsResult {
  value0: BigInt;
  value1: BigInt;

  constructor(value0: BigInt, value1: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    return map;
  }
}

export class BankExtension extends ethereum.SmartContract {
  static bind(address: Address): BankExtension {
    return new BankExtension("BankExtension", address);
  }

  availableInternalTokens(param0: Address): boolean {
    let result = super.call(
      "availableInternalTokens",
      "availableInternalTokens(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );

    return result[0].toBoolean();
  }

  try_availableInternalTokens(param0: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "availableInternalTokens",
      "availableInternalTokens(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  availableTokens(param0: Address): boolean {
    let result = super.call(
      "availableTokens",
      "availableTokens(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );

    return result[0].toBoolean();
  }

  try_availableTokens(param0: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "availableTokens",
      "availableTokens(address):(bool)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  checkpoints(
    param0: Address,
    param1: Address,
    param2: BigInt
  ): BankExtension__checkpointsResult {
    let result = super.call(
      "checkpoints",
      "checkpoints(address,address,uint32):(uint96,uint160)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );

    return new BankExtension__checkpointsResult(
      result[0].toBigInt(),
      result[1].toBigInt()
    );
  }

  try_checkpoints(
    param0: Address,
    param1: Address,
    param2: BigInt
  ): ethereum.CallResult<BankExtension__checkpointsResult> {
    let result = super.tryCall(
      "checkpoints",
      "checkpoints(address,address,uint32):(uint96,uint160)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new BankExtension__checkpointsResult(
        value[0].toBigInt(),
        value[1].toBigInt()
      )
    );
  }

  dao(): Address {
    let result = super.call("dao", "dao():(address)", []);

    return result[0].toAddress();
  }

  try_dao(): ethereum.CallResult<Address> {
    let result = super.tryCall("dao", "dao():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getFlag(flags: BigInt, flag: BigInt): boolean {
    let result = super.call("getFlag", "getFlag(uint256,uint256):(bool)", [
      ethereum.Value.fromUnsignedBigInt(flags),
      ethereum.Value.fromUnsignedBigInt(flag)
    ]);

    return result[0].toBoolean();
  }

  try_getFlag(flags: BigInt, flag: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall("getFlag", "getFlag(uint256,uint256):(bool)", [
      ethereum.Value.fromUnsignedBigInt(flags),
      ethereum.Value.fromUnsignedBigInt(flag)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  initialized(): boolean {
    let result = super.call("initialized", "initialized():(bool)", []);

    return result[0].toBoolean();
  }

  try_initialized(): ethereum.CallResult<boolean> {
    let result = super.tryCall("initialized", "initialized():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  internalTokens(param0: BigInt): Address {
    let result = super.call(
      "internalTokens",
      "internalTokens(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );

    return result[0].toAddress();
  }

  try_internalTokens(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "internalTokens",
      "internalTokens(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  numCheckpoints(param0: Address, param1: Address): BigInt {
    let result = super.call(
      "numCheckpoints",
      "numCheckpoints(address,address):(uint32)",
      [ethereum.Value.fromAddress(param0), ethereum.Value.fromAddress(param1)]
    );

    return result[0].toBigInt();
  }

  try_numCheckpoints(
    param0: Address,
    param1: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "numCheckpoints",
      "numCheckpoints(address,address):(uint32)",
      [ethereum.Value.fromAddress(param0), ethereum.Value.fromAddress(param1)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  setFlag(flags: BigInt, flag: BigInt, value: boolean): BigInt {
    let result = super.call(
      "setFlag",
      "setFlag(uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(flags),
        ethereum.Value.fromUnsignedBigInt(flag),
        ethereum.Value.fromBoolean(value)
      ]
    );

    return result[0].toBigInt();
  }

  try_setFlag(
    flags: BigInt,
    flag: BigInt,
    value: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "setFlag",
      "setFlag(uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(flags),
        ethereum.Value.fromUnsignedBigInt(flag),
        ethereum.Value.fromBoolean(value)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  tokens(param0: BigInt): Address {
    let result = super.call("tokens", "tokens(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toAddress();
  }

  try_tokens(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall("tokens", "tokens(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  isInternalToken(token: Address): boolean {
    let result = super.call(
      "isInternalToken",
      "isInternalToken(address):(bool)",
      [ethereum.Value.fromAddress(token)]
    );

    return result[0].toBoolean();
  }

  try_isInternalToken(token: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "isInternalToken",
      "isInternalToken(address):(bool)",
      [ethereum.Value.fromAddress(token)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  isTokenAllowed(token: Address): boolean {
    let result = super.call(
      "isTokenAllowed",
      "isTokenAllowed(address):(bool)",
      [ethereum.Value.fromAddress(token)]
    );

    return result[0].toBoolean();
  }

  try_isTokenAllowed(token: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "isTokenAllowed",
      "isTokenAllowed(address):(bool)",
      [ethereum.Value.fromAddress(token)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  isNotReservedAddress(applicant: Address): boolean {
    let result = super.call(
      "isNotReservedAddress",
      "isNotReservedAddress(address):(bool)",
      [ethereum.Value.fromAddress(applicant)]
    );

    return result[0].toBoolean();
  }

  try_isNotReservedAddress(applicant: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "isNotReservedAddress",
      "isNotReservedAddress(address):(bool)",
      [ethereum.Value.fromAddress(applicant)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  getToken(index: BigInt): Address {
    let result = super.call("getToken", "getToken(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(index)
    ]);

    return result[0].toAddress();
  }

  try_getToken(index: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall("getToken", "getToken(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(index)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  nbTokens(): BigInt {
    let result = super.call("nbTokens", "nbTokens():(uint256)", []);

    return result[0].toBigInt();
  }

  try_nbTokens(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("nbTokens", "nbTokens():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getInternalToken(index: BigInt): Address {
    let result = super.call(
      "getInternalToken",
      "getInternalToken(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(index)]
    );

    return result[0].toAddress();
  }

  try_getInternalToken(index: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getInternalToken",
      "getInternalToken(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(index)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  nbInternalTokens(): BigInt {
    let result = super.call(
      "nbInternalTokens",
      "nbInternalTokens():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_nbInternalTokens(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "nbInternalTokens",
      "nbInternalTokens():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  balanceOf(account: Address, tokenAddr: Address): BigInt {
    let result = super.call(
      "balanceOf",
      "balanceOf(address,address):(uint256)",
      [
        ethereum.Value.fromAddress(account),
        ethereum.Value.fromAddress(tokenAddr)
      ]
    );

    return result[0].toBigInt();
  }

  try_balanceOf(
    account: Address,
    tokenAddr: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "balanceOf",
      "balanceOf(address,address):(uint256)",
      [
        ethereum.Value.fromAddress(account),
        ethereum.Value.fromAddress(tokenAddr)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getPriorAmount(
    account: Address,
    tokenAddr: Address,
    blockNumber: BigInt
  ): BigInt {
    let result = super.call(
      "getPriorAmount",
      "getPriorAmount(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(account),
        ethereum.Value.fromAddress(tokenAddr),
        ethereum.Value.fromUnsignedBigInt(blockNumber)
      ]
    );

    return result[0].toBigInt();
  }

  try_getPriorAmount(
    account: Address,
    tokenAddr: Address,
    blockNumber: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getPriorAmount",
      "getPriorAmount(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(account),
        ethereum.Value.fromAddress(tokenAddr),
        ethereum.Value.fromUnsignedBigInt(blockNumber)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class InitializeCall extends ethereum.Call {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }

  get _dao(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get creator(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class WithdrawCall extends ethereum.Call {
  get inputs(): WithdrawCall__Inputs {
    return new WithdrawCall__Inputs(this);
  }

  get outputs(): WithdrawCall__Outputs {
    return new WithdrawCall__Outputs(this);
  }
}

export class WithdrawCall__Inputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }

  get account(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get tokenAddr(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class WithdrawCall__Outputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }
}

export class RegisterPotentialNewTokenCall extends ethereum.Call {
  get inputs(): RegisterPotentialNewTokenCall__Inputs {
    return new RegisterPotentialNewTokenCall__Inputs(this);
  }

  get outputs(): RegisterPotentialNewTokenCall__Outputs {
    return new RegisterPotentialNewTokenCall__Outputs(this);
  }
}

export class RegisterPotentialNewTokenCall__Inputs {
  _call: RegisterPotentialNewTokenCall;

  constructor(call: RegisterPotentialNewTokenCall) {
    this._call = call;
  }

  get token(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class RegisterPotentialNewTokenCall__Outputs {
  _call: RegisterPotentialNewTokenCall;

  constructor(call: RegisterPotentialNewTokenCall) {
    this._call = call;
  }
}

export class RegisterPotentialNewInternalTokenCall extends ethereum.Call {
  get inputs(): RegisterPotentialNewInternalTokenCall__Inputs {
    return new RegisterPotentialNewInternalTokenCall__Inputs(this);
  }

  get outputs(): RegisterPotentialNewInternalTokenCall__Outputs {
    return new RegisterPotentialNewInternalTokenCall__Outputs(this);
  }
}

export class RegisterPotentialNewInternalTokenCall__Inputs {
  _call: RegisterPotentialNewInternalTokenCall;

  constructor(call: RegisterPotentialNewInternalTokenCall) {
    this._call = call;
  }

  get token(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class RegisterPotentialNewInternalTokenCall__Outputs {
  _call: RegisterPotentialNewInternalTokenCall;

  constructor(call: RegisterPotentialNewInternalTokenCall) {
    this._call = call;
  }
}

export class AddToBalanceCall extends ethereum.Call {
  get inputs(): AddToBalanceCall__Inputs {
    return new AddToBalanceCall__Inputs(this);
  }

  get outputs(): AddToBalanceCall__Outputs {
    return new AddToBalanceCall__Outputs(this);
  }
}

export class AddToBalanceCall__Inputs {
  _call: AddToBalanceCall;

  constructor(call: AddToBalanceCall) {
    this._call = call;
  }

  get user(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get token(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class AddToBalanceCall__Outputs {
  _call: AddToBalanceCall;

  constructor(call: AddToBalanceCall) {
    this._call = call;
  }
}

export class SubtractFromBalanceCall extends ethereum.Call {
  get inputs(): SubtractFromBalanceCall__Inputs {
    return new SubtractFromBalanceCall__Inputs(this);
  }

  get outputs(): SubtractFromBalanceCall__Outputs {
    return new SubtractFromBalanceCall__Outputs(this);
  }
}

export class SubtractFromBalanceCall__Inputs {
  _call: SubtractFromBalanceCall;

  constructor(call: SubtractFromBalanceCall) {
    this._call = call;
  }

  get user(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get token(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class SubtractFromBalanceCall__Outputs {
  _call: SubtractFromBalanceCall;

  constructor(call: SubtractFromBalanceCall) {
    this._call = call;
  }
}

export class InternalTransferCall extends ethereum.Call {
  get inputs(): InternalTransferCall__Inputs {
    return new InternalTransferCall__Inputs(this);
  }

  get outputs(): InternalTransferCall__Outputs {
    return new InternalTransferCall__Outputs(this);
  }
}

export class InternalTransferCall__Inputs {
  _call: InternalTransferCall;

  constructor(call: InternalTransferCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get token(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }
}

export class InternalTransferCall__Outputs {
  _call: InternalTransferCall;

  constructor(call: InternalTransferCall) {
    this._call = call;
  }
}
