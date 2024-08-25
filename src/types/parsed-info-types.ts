interface CreateIdempotentInfo {
  owner: string
  token: string
}

interface TransferInfo {
  source: string
  destination: string
  lamports: number
}

interface SyncNativeInfo {
  // Add fields relevant to syncNative if any
}

interface TransferCheckedInfo {
  source: string
  destination: string
  amount: number
  // Add other relevant fields
}

interface CloseAccountInfo {
  source: string
  account: string
}

interface SwapInfo {
  source: string
  amountIn: number
  tokenIn: string
  amountOut: number
  tokenOut: string
}

interface UnknownInfo {
  // This can be used as a fallback for unknown instruction types
}

export type ParsedInfo =
  | CreateIdempotentInfo
  | TransferInfo
  | SyncNativeInfo
  | TransferCheckedInfo
  | CloseAccountInfo
  | SwapInfo
  | UnknownInfo

export enum SubscriptionMessageEnum {
  NO_USER_FOUND,
  INSUFFICIENT_BALANCE,
  INVALID_PLAN,
  PLAN_UPGRADED,
  INTERNAL_ERROR,
}
