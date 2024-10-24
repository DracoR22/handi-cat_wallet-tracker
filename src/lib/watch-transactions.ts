import { Connection, PublicKey } from '@solana/web3.js'
import { ValidTransactions } from './valid-transactions'
import EventEmitter from 'events'
import { TransactionParser } from '../parsers/transaction-parser'
import { SendTransactionMsgHandler } from '../bot/handlers/send-tx-msg-handler'
import { bot } from '../providers/telegram'
import { WalletWithUsers } from '../types/swap-types'
import { RateLimit } from './rate-limit'

export const trackedWallets: Set<string> = new Set()

export class WatchTransaction extends EventEmitter {
  public subscriptions: Map<string, number>

  private walletTransactions: Map<string, { count: number; startTime: number }>
  private excludedWallets: Map<string, boolean>

  // private trackedWallets: Set<string>

  private rateLimit: RateLimit
  constructor(private connection: Connection) {
    super()

    this.subscriptions = new Map()
    this.walletTransactions = new Map()
    this.excludedWallets = new Map()

    // this.trackedWallets = new Set()

    this.rateLimit = new RateLimit(this.connection)

    this.connection = connection
  }

  public async watchSocket(wallets: WalletWithUsers[]): Promise<void> {
    try {
      for (const wallet of wallets) {
        const publicKey = new PublicKey(wallet.address)
        const walletAddress = publicKey.toBase58()

        // Check if a subscription already exists for this wallet address
        if (this.subscriptions.has(walletAddress)) {
          console.log(`Already watching for: ${walletAddress}`)
          continue // Skip re-subscribing
        }

        console.log(`Watching transactions for wallet: ${walletAddress}`)

        // Initialize transaction count and timestamp
        this.walletTransactions.set(walletAddress, { count: 0, startTime: Date.now() })

        // Start real-time log
        const subscriptionId = this.connection.onLogs(
          publicKey,
          async (logs, ctx) => {
            // Exclude wallets that have reached the limit
            if (this.excludedWallets.has(walletAddress)) {
              console.log(`Wallet ${walletAddress} is excluded from logging.`)
              return
            }

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

            // Find all programIds involved in the transaction
            const programIds = transactionDetails[0]?.transaction.message.accountKeys
              .map((key) => key.pubkey)
              .filter((pubkey) => pubkey !== undefined)
            const validTransactions = new ValidTransactions(programIds)
            const isValidTransaction = validTransactions.getDefiTransaction()

            if (!isValidTransaction.valid) {
              console.log('TRANSACTION IS NOT DEFI TRANSACTION')
              return
            }

            // Parse transaction
            const transactionParser = new TransactionParser(transactionSignature, this.connection)
            const parsed = await transactionParser.parseNative(transactionDetails, isValidTransaction.swap)

            if (!parsed) {
              return
            }

            console.log(parsed)

            // Use bot to send message of transaction
            const sendMessageHandler = new SendTransactionMsgHandler(bot)

            const activeUsers = wallet.userWallets.filter((w) => w.handiCatStatus === 'ACTIVE')
            for (const user of activeUsers) {
              console.log('Users:', user)
              try {
                await sendMessageHandler.send(parsed, user.userId)
              } catch (error) {
                console.log(`Error sending message to user ${user.userId}`)
              }
            }
          },
          'confirmed',
        )

        // Store subscription ID
        this.subscriptions.set(wallet.address, subscriptionId)
        console.log(`Subscribed to logs with subscription ID: ${subscriptionId}`)
      }
    } catch (error) {
      console.error('Error in watchSocket:', error)
    }
  }

  private async getParsedTransaction(transactionSignature: string) {
    try {
      const transactionDetails = await this.connection.getParsedTransactions([transactionSignature], {
        maxSupportedTransactionVersion: 0,
      })

      return transactionDetails
    } catch (error) {
      console.log('GET_PARSED_TRANSACTIONS_ERROR', error)
      return
    }
  }
}
