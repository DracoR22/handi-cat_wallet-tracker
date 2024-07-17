import { Prisma } from "@prisma/client";

export type SwapType = 'PUMP FUN' | 'RAYDIUM' | null;

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
  }>;