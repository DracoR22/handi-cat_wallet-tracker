import { MAX_FREE_WALLETS, MAX_HOBBY_WALLETS, MAX_PRO_WALLETS, MAX_WHALE_WALLETS } from '../constants/pricing'
import { PrismaSubscriptionRepository } from '../repositories/prisma/subscription'

export class UserPlan {
  private prismaSubscriptionRepository: PrismaSubscriptionRepository
  constructor() {
    this.prismaSubscriptionRepository = new PrismaSubscriptionRepository()
  }

  public async getUserPlanWallets(userId: string): Promise<number> {
    const userSubscription = await this.prismaSubscriptionRepository.getUserSubscription(userId)

    const plan = userSubscription?.plan || 'FREE'

    const planWalletsKey: { [key: string]: number } = {
      FREE: MAX_FREE_WALLETS,
      HOBBY: MAX_HOBBY_WALLETS,
      PRO: MAX_PRO_WALLETS,
      WHALE: MAX_WHALE_WALLETS,
    }

    const planWallets = planWalletsKey[plan]

    return planWallets
  }
}
