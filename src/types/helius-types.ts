type TokenTransfer = {
  fromTokenAccount: string
  toTokenAccount: string
  fromUserAccount: string
  toUserAccount: string
  tokenAmount: number
  mint: string
  tokenStandard: string
}

type NativeTransfer = {
  fromUserAccount: string
  toUserAccount: string
  amount: number
}

type TokenBalanceChange = {
  userAccount: string
  tokenAccount: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
  mint: string
}

type AccountData = {
  account: string
  nativeBalanceChange: number
  tokenBalanceChanges: TokenBalanceChange[]
}

type Instruction = {
  accounts: string[]
  data: string
  programId: string
  innerInstructions: Instruction[]
}

type EventSwap = {
  nativeInput: {
    account: string
    amount: string
  }
  nativeOutput: null | {
    account: string
    amount: string
  }
  tokenInputs: TokenTransfer[]
  tokenOutputs: TokenTransfer[]
}

type Events = {
  swap: EventSwap
}

export type Transaction = {
  description: string
  type: string
  source: string
  fee: number
  feePayer: string
  signature: string
  slot: number
  timestamp: number
  tokenTransfers: TokenTransfer[]
  nativeTransfers: NativeTransfer[]
  accountData: AccountData[]
  transactionError: null | string
  instructions: Instruction[]
  events: Events
}

export type GmgnWalletResponse = {
  code: number
  msg: string
  data: {
    twitter_bind: boolean
    twitter_fans_num: number
    twitter_username: string | null
    twitter_name: string | null
    ens: string | null
    avatar: string | null
    name: string | null
    eth_balance: string
    sol_balance: string
    total_value: number
    unrealized_profit: number
    unrealized_pnl: number
    realized_profit: number
    pnl: number
    pnl_7d: number
    pnl_30d: number
    realized_profit_7d: number
    realized_profit_30d: number
    winrate: number
    all_pnl: number
    total_profit: number
    total_profit_pnl: number
    buy_30d: number
    sell_30d: number
    buy_7d: number
    sell_7d: number
    buy: number
    sell: number
    history_bought_cost: number
    token_avg_cost: number
    token_sold_avg_profit: number
    token_num: number
    profit_num: number
    pnl_lt_minus_dot5_num: number
    pnl_minus_dot5_0x_num: number
    pnl_lt_2x_num: number
    pnl_2x_5x_num: number
    pnl_gt_5x_num: number
    last_active_timestamp: number
    tags: string[]
    tag_rank: Record<string, unknown>
    followers_count: number
    is_contract: boolean
    updated_at: number
    refresh_requested_at: number | null
  }
}
