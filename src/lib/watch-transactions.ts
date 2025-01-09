import { Connection, PublicKey, LogsFilter, Logs } from '@solana/web3.js'
import { ValidTransactions } from './valid-transactions'
import EventEmitter from 'events'
import { TransactionParser } from '../parsers/transaction-parser'
import { SendTransactionMsgHandler } from '../bot/handlers/send-tx-msg-handler'
import { bot } from '../providers/telegram'
import { SwapType, WalletWithUsers } from '../types/swap-types'
import { RateLimit } from './rate-limit'
import {
  JUPITER_PROGRAM_ID,
  PUMP_FUN_PROGRAM_ID,
  PUMP_FUN_TOKEN_MINT_AUTH,
  RAYDIUM_PROGRAM_ID,
} from '../config/program-ids'
import chalk from 'chalk'
import { connection, logConnection } from '../providers/solana'
import { NativeParserInterface } from '../types/general-interfaces'
import pLimit from 'p-limit'

export const trackedWallets: Set<string> = new Set()

export class WatchTransaction extends EventEmitter {
  public subscriptions: Map<string, number>

  private walletTransactions: Map<string, { count: number; startTime: number }>
  private excludedWallets: Map<string, boolean>

  // private trackedWallets: Set<string>

  private rateLimit: RateLimit
  constructor() {
    super()

    this.subscriptions = new Map()
    this.walletTransactions = new Map()
    this.excludedWallets = new Map()

    // this.trackedWallets = new Set()

    this.rateLimit = new RateLimit(this.subscriptions)
  }

  public async watchSocket(wallets: WalletWithUsers[]): Promise<void> {
    try {
      for (const wallet of wallets) {
        const publicKey = new PublicKey(wallet.address)
        const walletAddress = publicKey.toBase58()

        // Check if a subscription already exists for this wallet address
        if (this.subscriptions.has(walletAddress)) {
          // console.log(`Already watching for: ${walletAddress}`)
          continue // Skip re-subscribing
        }

        console.log(chalk.greenBright(`Watching transactions for wallet: `) + chalk.yellowBright.bold(walletAddress))

        // Initialize transaction count and timestamp
        this.walletTransactions.set(walletAddress, { count: 0, startTime: Date.now() })

        // Start real-time log
        const subscriptionId = logConnection.onLogs(
          publicKey,
          async (logs, ctx) => {
            // Exclude wallets that have reached the limit
            if (this.excludedWallets.has(walletAddress)) {
              console.log(`Wallet ${walletAddress} is excluded from logging.`)
              return
            }

            const { isRelevant, swap } = this.isRelevantTransaction(logs)

            if (!isRelevant) {
              // console.log('TRANSACTION IS NOT DEFI', logs.signature)
              return
            }
            // console.log('TRANSACTION IS DEFI', logs.signature)
            // check txs per second
            const walletData = this.walletTransactions.get(walletAddress)
            if (!walletData) {
              return
            }

            const isWalletRateLimited = await this.rateLimit.txPerSecondCap({
              wallet,
              bot,
              excludedWallets: this.excludedWallets,
              walletData,
            })

            if (isWalletRateLimited) return

            const transactionSignature = logs.signature
            const transactionDetails = await this.getParsedTransaction(transactionSignature)

            if (!transactionDetails) {
              return
            }

            // Parse transaction
            const transactionParser = new TransactionParser(transactionSignature)
            const parsed = await transactionParser.parseRpc(transactionDetails, swap)

            if (!parsed) {
              return
            }

            console.log(parsed)

            // Use bot to send message of transaction
            await this.sendMessagesToUsers(wallet, parsed)
          },
          'processed',
        )

        // Store subscription ID
        this.subscriptions.set(wallet.address, subscriptionId)
        console.log(
          chalk.greenBright(`Subscribed to logs with subscription ID: `) + chalk.yellowBright.bold(subscriptionId),
        )
      }
    } catch (error) {
      console.error('Error in watchSocket:', error)
    }
  }

  public async getParsedTransaction(transactionSignature: string) {
    try {
      const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
        maxSupportedTransactionVersion: 0,
      })

      return transactionDetails
    } catch (error) {
      console.log('GET_PARSED_TRANSACTIONS_ERROR', error)
      return
    }
  }

  private async sendMessagesToUsers(wallet: WalletWithUsers, parsed: NativeParserInterface) {
    const sendMessageHandler = new SendTransactionMsgHandler(bot)

    const activeUsers = wallet.userWallets.filter((w) => w.handiCatStatus === 'ACTIVE')
    // just in case, somehow sometimes I get duplicated users here, I should probably address this in the track wallets function instead
    const uniqueActiveUsers = Array.from(new Set(activeUsers.map((user) => user.userId))).map((userId) =>
      activeUsers.find((user) => user.userId === userId),
    )

    const limit = pLimit(30)

    const tasks = uniqueActiveUsers.map((user) =>
      limit(async () => {
        if (user) {
          console.log('Users:', user)
          try {
            await sendMessageHandler.send(parsed, user.userId)
          } catch (error) {
            console.log(`Error sending message to user ${user.userId}:`, error)
          }
        }
      }),
    )

    await Promise.all(tasks)
  }

  private isRelevantTransaction(logs: Logs): { isRelevant: boolean; swap: SwapType } {
    if (!logs.logs || logs.logs.length === 0) {
      return { isRelevant: false, swap: null }
    }

    const logString = logs.logs.join(' ')

    if (logString.includes(PUMP_FUN_TOKEN_MINT_AUTH)) {
      return { isRelevant: true, swap: 'mint_pumpfun' }
    }
    if (logString.includes(PUMP_FUN_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'pumpfun' }
    }
    if (logString.includes(JUPITER_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'jupiter' }
    }
    if (logString.includes(RAYDIUM_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'raydium' }
    }

    return { isRelevant: false, swap: null }
  }
}
