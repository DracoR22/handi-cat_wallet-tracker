import { SubscriptionPlan, User, UserSubscription, WalletStatus } from '@prisma/client'

export type UserWallet = {
  wallet: {
    id: string
    address: string
  }
  userId: string
  walletId: string
  name: string
  status: WalletStatus
}

export type UserWithSubscriptionPlan = {
  personalWalletPubKey: string
  userSubscription: {
    plan: SubscriptionPlan
    subscriptionCurrentPeriodEnd: Date | null
  } | null
}

export type UserPrisma = {
  userSubscription: {
    plan: SubscriptionPlan
  } | null
  id: string
  hasDonated: boolean
  personalWalletPubKey: string
  personalWalletPrivKey: string
  _count: {
    userWallets: number
  }
} | null
