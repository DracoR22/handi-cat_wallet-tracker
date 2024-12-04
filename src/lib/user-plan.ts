import { MAX_FREE_WALLETS, MAX_HOBBY_WALLETS, MAX_PRO_WALLETS, MAX_WHALE_WALLETS } from '../constants/pricing'
import { PrismaSubscriptionRepository } from '../repositories/prisma/subscription'

export class UserPlan {
  private prismaSubscriptionRepository: PrismaSubscriptionRepository
  constructor() {
    this.prismaSubscriptionRepository = new PrismaSubscriptionRepository()
  }

  public async getUserPlanWallets(userId: string): Promise<number> {
    const userData = await this.prismaSubscriptionRepository.getUserPlanWallets(userId)

    const plan = userData?.userSubscription?.plan || 'FREE'

    const planWalletsConfig: { [key: string]: number } = {
      FREE: MAX_FREE_WALLETS,
      HOBBY: MAX_HOBBY_WALLETS,
      PRO: MAX_PRO_WALLETS,
      WHALE: MAX_WHALE_WALLETS,
    }

    // Determine if the user qualifies for a promotion
    const getPromotionWallets = (userPromotions: any[] | undefined): number | null => {
      if (userPromotions && userPromotions.some((promo) => promo.promotion.type === 'UPGRADE_TO_50_WALLETS')) {
        return 50
      }
      return null
    }

    const planWallets = getPromotionWallets(userData?.userPromotions) ?? planWalletsConfig[plan]

    return planWallets
  }
}
