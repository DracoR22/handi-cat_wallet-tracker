import cron from 'node-cron'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { Payments } from './payments'
import { TokenUtils } from './token-utils'

export class CronJobs {
  private prismaUserRepository: PrismaUserRepository
  private payments: Payments

  private static cachedPrice: string | undefined = undefined
  private static lastFetched: number = 0
  private static readonly refreshInterval: number = 5 * 60 * 1000 // 5 minutes
  constructor() {
    this.prismaUserRepository = new PrismaUserRepository()
    this.payments = new Payments()
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

        const chargeResult = await this.payments.chargeSubscription(user.id, user.plan)

        if (chargeResult.success) {
          console.log(
            `Successfully charged user ${user.userId} and updated subscription to next period ending on ${chargeResult.subscriptionEnd}.`,
          )
        } else {
          console.log(`Failed to charge user ${user.userId}: ${chargeResult.message}`)
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
        solPrice = await TokenUtils.getSolPriceNative()
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

  static getSolPrice() {
    return this.cachedPrice
  }
}
