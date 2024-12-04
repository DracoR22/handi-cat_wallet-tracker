import { PromotionType, SubscriptionPlan } from '@prisma/client'
import prisma from '../../providers/prisma'

export class PrismaSubscriptionRepository {
  constructor() {}

  public async getUserPlanWallets(userId: string) {
    // Fetch user subscription and promotions in a single query
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userSubscription: {
          select: {
            plan: true,
            isCanceled: true,
            subscriptionCurrentPeriodEnd: true,
          },
        },
        userPromotions: {
          select: {
            promotion: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    })

    return userData
  }

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

  public async buyPromotion(
    userId: string,
    promotionType: PromotionType,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const promotion = await prisma.promotion.findFirst({
        where: { type: promotionType },
        select: { id: true, isActive: true, isStackable: true },
      })

      if (!promotion) {
        console.log('Promotion not found')
        return { success: false, message: 'Promotion not found' }
      }

      const existingUserPromotion = await prisma.userPromotion.findFirst({
        where: { userId, promotionId: promotion.id },
      })

      if (existingUserPromotion && !promotion.isStackable) {
        console.log('User already purchased this non-stackable promotion')
        return { success: false, message: 'Non-stackable promotion already purchased' }
      }

      if (!promotion.isActive) {
        console.log('Promotion has expired')
        return { success: false, message: 'Promotion has expired' }
      }

      await prisma.userPromotion.create({
        data: {
          userId,
          promotionId: promotion.id,
        },
      })

      console.log(`PROMOTION ${promotionType} was purchased by ${userId}`)
      return { success: true, message: 'Promotion purchased successfully' }
    } catch (error) {
      console.error('Failed to purchase promotion:', error)
      return { success: false, message: 'Error purchasing promotion' }
    }
  }
}
