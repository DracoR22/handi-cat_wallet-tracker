import cron from 'node-cron'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { Payments } from './payments'
import { TokenUtils } from './token-utils'
import { WatchTransaction } from './watch-transactions'
import { RpcConnectionManager } from '../providers/solana'
import { TrackWallets } from './track-wallets'
import { bot } from '../providers/telegram'
import { SubscriptionMessages } from '../bot/messages/subscription-messages'
import dotenv from 'dotenv'
import { WalletPool } from '../config/wallet-pool'

dotenv.config()

export class CronJobs {
  private prismaUserRepository: PrismaUserRepository
  private payments: Payments
  private walletWatcher: WatchTransaction
  private trackWallets: TrackWallets

  private static cachedPrice: string | undefined = undefined
  private static lastFetched: number = 0
  private static readonly refreshInterval: number = 5 * 60 * 1000 // 5 minutes
  constructor() {
    this.prismaUserRepository = new PrismaUserRepository()
    this.payments = new Payments()
    this.walletWatcher = new WatchTransaction()
    this.trackWallets = new TrackWallets()
  }

  public async monthlySubscriptionFee() {
    cron.schedule('0 0 * * *', async () => {
      console.log('Charging subscriptions')

      const usersToCharge = await this.prismaUserRepository.getUsersWithDue()

      if (!usersToCharge || usersToCharge.length === 0) {
        console.log('No users to charge today')
        return
      }

      for (const user of usersToCharge) {
        console.log(`Charging user with ID: ${user.userId}`)

        const chargeResult = await this.payments.autoReChargeSubscription(user.id, user.plan)

        if (chargeResult.success) {
          console.log(
            `Successfully charged user ${user.userId} and updated subscription to next period ending on ${chargeResult.subscriptionEnd}.`,
            bot.sendMessage(user.id, SubscriptionMessages.planRenewedMessage(chargeResult.subscriptionEnd || ''), {
              parse_mode: 'HTML',
            }),
          )

          bot.sendMessage(
            process.env.ADMIN_CHAT_ID ?? '',
            `Sent success renewal message to ${usersToCharge.length}, Users: ${usersToCharge.map((u) => u.userId).join(', ')}`,
          )
        } else {
          console.log(`Failed to charge user ${user.userId}: ${chargeResult.message}`)
          bot.sendMessage(
            user.id,
            `
⚠️ Oops! We couldn’t renew your Handi Cat subscription.  

💡 <b>Please check your Handi Cat wallet balance</b> and try upgrading your plan again to keep your tracked wallets.  
            `,
            {
              parse_mode: 'HTML',
            },
          )

          bot.sendMessage(
            process.env.ADMIN_CHAT_ID ?? '',
            `Sent failed plan renewal message to ${usersToCharge.length}, Users: ${usersToCharge.map((u) => u.userId).join(', ')}`,
          )
        }
      }
    })
  }

  public async sendRenewalReminder() {
    cron.schedule('0 0 * * *', async () => {
      console.log('Sending renewal reminders')

      const usersToRemind = await this.prismaUserRepository.getUsersWithEndingTomorrow()

      if (!usersToRemind || usersToRemind.length === 0) {
        console.log('No users to remind today')
        return
      }

      for (const user of usersToRemind) {
        try {
          bot.sendMessage(
            user.userId,
            SubscriptionMessages.subscriptionRenewalMessage(user.user?.username || 'there', user.plan),
            {
              parse_mode: 'HTML',
            },
          )
          console.log(`Successfully sent renewal reminder to user ${user.userId}`)
        } catch (error) {
          console.error(`Failed to send reminder to user ${user.userId}:`, error)
        }
      }
    })
  }

  public async updateSolPrice(): Promise<string | undefined> {
    const now = Date.now()

    if (CronJobs.cachedPrice && now - CronJobs.lastFetched < CronJobs.refreshInterval) {
      // console.log('Using cached Solana price:', CronJobs.cachedPrice)
      return CronJobs.cachedPrice
    }

    try {
      // console.log('REFETCHING SOL PRICE')
      let solPrice = await TokenUtils.getSolPriceGecko()

      if (!solPrice) {
        solPrice = await TokenUtils.getSolPriceRpc()
      }

      if (solPrice) {
        CronJobs.cachedPrice = solPrice
        CronJobs.lastFetched = now
      }

      return CronJobs.cachedPrice!
    } catch (error) {
      console.error('Error fetching Solana price:', error)

      // Fallback to the last cached price, if available
      if (CronJobs.cachedPrice) {
        return CronJobs.cachedPrice
      }

      return
    }
  }

  public async unsubscribeAllWallets() {
    cron.schedule('*/1 * * * *', async () => {
      console.log('Triggering resetLogConnection...')
      RpcConnectionManager.resetLogConnection()
      WalletPool.subscriptions.clear()
      WalletPool.bannedWallets.clear()
      await this.trackWallets.setupWalletWatcher({ event: 'initial' })
    })
  }

  static getSolPrice() {
    return this.cachedPrice
  }
}
