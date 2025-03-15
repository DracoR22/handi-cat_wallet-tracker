import TelegramBot from 'node-telegram-bot-api'
import { SwapType, WalletWithUsers } from './swap-types'

export interface NativeParserInterface {
  platform: SwapType
  owner: string
  description: string
  type: string | undefined
  balanceChange: string | number | undefined
  signature: string
  swappedTokenMc: number | null | undefined
  swappedTokenPrice: number | null | undefined
  solPrice: string
  currentHoldingPrice: string
  currenHoldingPercentage: string
  isNew: boolean
  tokenTransfers: {
    tokenInSymbol: string
    tokenOutSymbol: string
    tokenInMint: string
    tokenOutMint: string
    tokenAmountIn: string
    tokenAmountOut: string
  }
}

export interface TransferParserInterface {
  owner: string
  description: string
  fromAddress: string
  toAddress: string
  solAmount: number
  lamportsAmount: number
  solPrice: string
  signature: string
}

export interface CreateUserInterface {
  id: string
  username: string
  firstName: string
  lastName: string
}

export interface CreateUserGroupInterface {
  id: string
  name: string
  userId: string
}

export interface ParsedTxInfo {
  info: {
    amount: string
    authority: string
    destination: string
    source: string
  }
  type: string
}

export interface UserGroup {
  id: string
  name: string
}

export interface TxPerSecondCapInterface {
  wallet: WalletWithUsers
  bot: TelegramBot
  walletData: { count: number; startTime: number }
  excludedWallets: Map<string, boolean>
}

export interface SetupWalletWatcherProps {
  userId?: string | null
  walletId?: string | null
  event: 'create' | 'delete' | 'initial' | 'update'
}
