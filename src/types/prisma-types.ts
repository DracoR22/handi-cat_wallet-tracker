import { SubscriptionPlan, User, UserSubscription } from '@prisma/client'

export type UserWallet = {
  wallet: {
    id: string
    address: string
  }
  userId: string
  walletId: string
  name: string
}

export type UserWithSubscriptionPlan = {
  personalWalletPubKey: string
  userSubscription: {
    plan: SubscriptionPlan
  } | null
}
