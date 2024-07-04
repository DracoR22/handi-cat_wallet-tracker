type TokenTransfer = {
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  };
  
  type NativeTransfer = {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  };
  
  type TokenBalanceChange = {
    userAccount: string;
    tokenAccount: string;
    rawTokenAmount: {
      tokenAmount: string;
      decimals: number;
    };
    mint: string;
  };
  
  type AccountData = {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: TokenBalanceChange[];
  };
  
  type Instruction = {
    accounts: string[];
    data: string;
    programId: string;
    innerInstructions: Instruction[];
  };
  
  type EventSwap = {
    nativeInput: {
      account: string;
      amount: string;
    };
    nativeOutput: null | {
      account: string;
      amount: string;
    };
    tokenInputs: TokenTransfer[];
    tokenOutputs: TokenTransfer[];
  };
  
  type Events = {
    swap: EventSwap;
  };
  
 export type Transaction = {
    description: string;
    type: string;
    source: string;
    fee: number;
    feePayer: string;
    signature: string;
    slot: number;
    timestamp: number;
    tokenTransfers: TokenTransfer[];
    nativeTransfers: NativeTransfer[];
    accountData: AccountData[];
    transactionError: null | string;
    instructions: Instruction[];
    events: Events;
  };