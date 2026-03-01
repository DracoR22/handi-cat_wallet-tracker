import { User, UserSubscription } from '@prisma/client'

export type UserWallet = {
  wallet: {
    id: string
    address: string
  }
  userId: string
  walletId: string
  name: string
  status: string
}

export type UserWithSubscriptionPlan = {
  personalWalletPubKey: string
  userSubscription: {
    plan: string
    subscriptionCurrentPeriodEnd: Date | null
  } | null
}

export type UserPrisma = {
  userSubscription: {
    plan: string
  } | null
  id: string
  hasDonated: boolean
  personalWalletPubKey: string
  personalWalletPrivKey: string
  _count: {
    userWallets: number
  }
} | null
