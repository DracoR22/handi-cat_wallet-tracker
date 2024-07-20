import { Prisma } from "@prisma/client";

export type SwapType = 'pumpfun' | 'raydium' | null;

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