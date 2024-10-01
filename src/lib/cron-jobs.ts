import cron from 'node-cron'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { Payments } from './payments'

export class CronJobs {
  private prismaUserRepository: PrismaUserRepository
  private payments: Payments
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
}
