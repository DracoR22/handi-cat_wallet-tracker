import { Connection, PublicKey, LogsFilter, Logs } from '@solana/web3.js'
import { ValidTransactions } from './valid-transactions'
import EventEmitter from 'events'
import { TransactionParser } from '../parsers/transaction-parser'
import { SendTransactionMsgHandler } from '../bot/handlers/send-tx-msg-handler'
import { bot } from '../providers/telegram'
import { SwapType, WalletWithUsers } from '../types/swap-types'
import { RateLimit } from './rate-limit'
import chalk from 'chalk'
import { RpcConnectionManager } from '../providers/solana'
import pLimit from 'p-limit'
import { CronJobs } from './cron-jobs'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { WalletPool } from '../config/wallet-pool'
import TelegramBot from 'node-telegram-bot-api'

export class WatchTransaction extends EventEmitter {
  private walletTransactions: Map<string, { count: number; startTime: number }>

  private rateLimit: RateLimit

  private prismaUserRepository: PrismaUserRepository
  constructor() {
    super()

    this.walletTransactions = new Map()

    // this.trackedWallets = new Set()

    this.rateLimit = new RateLimit(WalletPool.subscriptions)

    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async watchSocket(wallets: WalletWithUsers[]): Promise<void> {
    try {
      for (const wallet of wallets) {
        const publicKey = new PublicKey(wallet.address)
        const walletAddress = publicKey.toBase58()

        // Check if a subscription already exists for this wallet address
        if (WalletPool.subscriptions.has(walletAddress)) {
          // console.log(`Already watching for: ${walletAddress}`)
          continue // Skip re-subscribing
        }

        console.log(chalk.greenBright(`Watching transactions for wallet: `) + chalk.yellowBright.bold(walletAddress))

        // Initialize transaction count and timestamp
        this.walletTransactions.set(walletAddress, { count: 0, startTime: Date.now() })

        // Start real-time log
        const subscriptionId = RpcConnectionManager.logConnection.onLogs(
          publicKey,
          async (logs, ctx) => {
            // Exclude wallets that have reached the limit
            if (WalletPool.bannedWallets.has(walletAddress)) {
              console.log(`Wallet ${walletAddress} is excluded from logging.`)

              return
            }

            // if (wallet.userWallets[0].status === 'SPAM_PAUSED') {
            //   console.log('PAUSED TRANSACTIONS FOR: ', walletAddress)
            //   return
            // }

            const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(logs)

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
              excludedWallets: WalletPool.bannedWallets,
              walletData,
            })

            if (isWalletRateLimited) {
              return
            }

            const transactionSignature = logs.signature

            const transactionDetails = await this.getParsedTransaction(transactionSignature)

            if (!transactionDetails || transactionDetails[0] === null) {
              return
            }

            // Parse transaction
            const solPriceUsd = CronJobs.getSolPrice()
            const transactionParser = new TransactionParser(transactionSignature)

            if (
              swap === 'raydium' ||
              swap === 'jupiter' ||
              swap === 'pumpfun' ||
              swap === 'mint_pumpfun' ||
              swap === 'pumpfun_amm'
            ) {
              const parsed = await transactionParser.parseDefiTransaction(
                transactionDetails,
                swap,
                solPriceUsd,
                walletAddress,
              )
              if (!parsed) {
                return
              }
              console.log(parsed.description)

              // await this.sendTransactionMessageToUsers(wallet, parsed)S
              await this.sendMessageToUsers(wallet, parsed, (handler, parsedData, userId) =>
                handler.sendTransactionMessage(parsedData, userId),
              )
            } else if (swap === 'sol_transfer') {
              const parsed = await transactionParser.parseSolTransfer(transactionDetails, solPriceUsd, walletAddress)
              if (!parsed) {
                return
              }
              console.log(parsed.description)

              // await this.sendTransferMessageToUsers(wallet, parsed)
              await this.sendMessageToUsers(wallet, parsed, (handler, parsedData, userId) =>
                handler.sendTransferMessage(parsedData, userId),
              )
            }
          },
          'processed',
        )

        // Store subscription ID
        WalletPool.subscriptions.set(wallet.address, subscriptionId)
        console.log(
          chalk.greenBright(`Subscribed to logs with subscription ID: `) + chalk.yellowBright.bold(subscriptionId),
        )
      }
    } catch (error) {
      console.error('Error in watchSocket:', error)
    }
  }

  public async getParsedTransaction(transactionSignature: string, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const transactionDetails = await RpcConnectionManager.getRandomConnection().getParsedTransactions(
          [transactionSignature],
          {
            maxSupportedTransactionVersion: 0,
          },
        )

        if (transactionDetails && transactionDetails[0] !== null) {
          return transactionDetails
        }

        console.log(`Attempt ${attempt}: No transaction details found for ${transactionSignature}`)
      } catch (error) {
        console.error(`Attempt ${attempt}: Error fetching transaction details`, error)
      }

      // Delay before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }

    console.error(`Failed to fetch transaction details after ${retries} retries for signature:`, transactionSignature)
    return null
  }

  private async sendMessageToUsers<T>(
    wallet: WalletWithUsers,
    parsed: T,
    sendMessageFn: (
      handler: SendTransactionMsgHandler,
      parsed: T,
      userId: string,
    ) => Promise<TelegramBot.Message | undefined>,
  ) {
    const sendMessageHandler = new SendTransactionMsgHandler(bot)

    const pausedUsers = (await this.prismaUserRepository.getPausedUsers(wallet.userWallets.map((w) => w.userId))) || []

    const activeUsers = wallet.userWallets.filter((w) => !pausedUsers || !pausedUsers.includes(w.userId))

    // Remove duplicate users
    const uniqueActiveUsers = Array.from(new Set(activeUsers.map((user) => user.userId))).map((userId) =>
      activeUsers.find((user) => user.userId === userId),
    )

    const limit = pLimit(20)

    const tasks = uniqueActiveUsers.map((user) =>
      limit(async () => {
        if (user) {
          try {
            await sendMessageFn(sendMessageHandler, parsed, user.userId)
          } catch (error) {
            console.log(`Error sending message to user ${user.userId}`)
          }
        }
      }),
    )

    await Promise.all(tasks)
  }
}
