import { PublicKey } from '@solana/web3.js'
import { connection } from '../providers/solana'

import { SubscriptionPlan } from '@prisma/client'
import { MAX_FREE_DAILY_MESSAGES } from '../constants/pricing'

import { RateLimitMessages } from '../bot/messages/rate-limit-messages'
import { TxPerSecondCapInterface } from '../types/interfaces'
import { MAX_5_MIN_TXS_ALLOWED, MAX_TPS_ALLOWED, WALLET_SLEEP_TIME } from '../constants/handi-cat'

export class RateLimit {
  private rateLimitMessages: RateLimitMessages

  constructor() {
    this.rateLimitMessages = new RateLimitMessages()
  }

  public async last5MinutesTxs(walletAddress: string) {
    const currentTime = Date.now()

    // Calculate the time 5 minutes ago
    const fiveMinutesAgo = currentTime - 1 * 60 * 1000

    // Fetch recent transaction signatures for the given wallet
    const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress), {
      limit: MAX_5_MIN_TXS_ALLOWED,
    })

    // Filter the transactions that occurred in the last 5 minutes
    const recentTransactions = signatures.filter((signatureInfo) => {
      const transactionTime = signatureInfo.blockTime! * 1000 // Convert seconds to milliseconds
      return transactionTime >= fiveMinutesAgo
    })

    // Return the number of transactions in the last 5 minutes
    return recentTransactions.length
  }

  public async txPerSecondCap({ bot, excludedWallets, wallet, walletData }: TxPerSecondCapInterface) {
    walletData.count++
    const elapsedTime = (Date.now() - walletData.startTime) / 1000 // seconds

    if (elapsedTime >= 1) {
      const tps = walletData.count / elapsedTime
      console.log(`TPS for wallet ${wallet.address}: ${tps.toFixed(2)}`)

      if (tps >= MAX_TPS_ALLOWED) {
        // Immediately exclude spamming wallet
        excludedWallets.set(wallet.address, true)
        console.log(`Wallet ${wallet.address} excluded for 20 minutes due to high TPS.`)

        for (const user of wallet.userWallets) {
          bot.sendMessage(user.userId, this.rateLimitMessages.walletWasPaused(wallet.address), { parse_mode: 'HTML' })
        }

        setTimeout(() => {
          excludedWallets.delete(wallet.address)

          for (const user of wallet.userWallets) {
            bot.sendMessage(user.userId, this.rateLimitMessages.walletWasResumed(wallet.address), {
              parse_mode: 'HTML',
            })
          }

          console.log(`Wallet ${wallet.address} re-included after 20 minutes.`)
        }, WALLET_SLEEP_TIME)

        // Stop processing for this wallet
        return false
      }

      // Reset for next interval
      walletData.count = 0
      walletData.startTime = Date.now()
    }

    return true
  }

  public async dailyMessageLimit(messagesToday: number, userPlan: SubscriptionPlan) {
    if (userPlan === 'FREE' && messagesToday >= MAX_FREE_DAILY_MESSAGES) {
      return { dailyLimitReached: true }
    }
  }
}
