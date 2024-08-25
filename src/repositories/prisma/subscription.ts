import { SubscriptionPlan } from '@prisma/client'
import prisma from './prisma'

export class PrismaSubscriptionRepository {
  constructor() {}

  public async getUserSubscription(userId: string) {
    const userSubscription = await prisma.userSubscription.findUnique({
      where: {
        userId,
      },
      select: {
        isCanceled: true,
        subscriptionCurrentPeriodEnd: true,
        plan: true,
      },
    })

    return userSubscription
  }

  public async updateUserSubscription(userId: string, plan: SubscriptionPlan) {
    const userSubscription = await this.getUserSubscription(userId)

    const now = new Date()
    const oneMonthFromNow = new Date(now.setMonth(now.getMonth() + 1))

    const subscriptionCurrentPeriodEnd = plan === 'FREE' ? null : oneMonthFromNow

    // create subscription if it doesnt exists
    if (!userSubscription) {
      const newSubscription = await prisma.userSubscription.create({
        data: {
          userId,
          plan,
          subscriptionCurrentPeriodEnd,
        },
        select: {
          subscriptionCurrentPeriodEnd: true,
        },
      })

      return newSubscription
      // subscription will exist if it has already been active or canceled
    } else {
      const updatedSubscription = await prisma.userSubscription.update({
        where: {
          userId,
        },
        data: {
          plan,
          isCanceled: false,
          subscriptionCurrentPeriodEnd,
        },
        select: {
          subscriptionCurrentPeriodEnd: true,
        },
      })

      return updatedSubscription
    }
  }

  public async cancelUserSubscription(userId: string) {
    const userSubscription = await this.getUserSubscription(userId)

    if (!userSubscription) {
      console.log('No subscription found')
      return
    }

    const canceledSubscription = await prisma.userSubscription.update({
      where: {
        userId,
      },
      data: {
        plan: 'FREE',
        isCanceled: true,
        subscriptionCurrentPeriodEnd: new Date(),
      },
    })

    return canceledSubscription
  }
}
