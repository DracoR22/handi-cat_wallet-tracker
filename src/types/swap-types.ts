import { Prisma, User } from '@prisma/client'

export type SwapType = 'pumpfun' | 'raydium' | 'jupiter' | 'mint_pumpfun' | 'sol_transfer' | null

export type WalletWithUsers = Prisma.WalletGetPayload<{
  include: {
    userWallets: {
      include: {
        user: {
          select: {
            id: true
          }
        }
      }
    }
  }
}>

export type WalletsToTrack = {
  address: string
  id: string
  userWallets: [
    {
      name: string
      userId: string
      walletId: string
      user: Pick<User, 'id'>
    },
  ]
}
