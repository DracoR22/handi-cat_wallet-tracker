import prisma from "./prisma";

export class PrismaWalletRepository {
    constructor() {}

    public async create(userId: string, walletAddress: string) {
      try {
          const existingWallet = await prisma.wallet.findFirst({
            where: {
              address: walletAddress,
            },
            select: {
              id: true
            }
          })

          if (existingWallet) {
            // Check if the user is already linked to this wallet
            const userWalletLink = await prisma.userWallet.findFirst({
              where: {
                  userId,
                  walletId: existingWallet.id,
              },
              select: {
                userId: true
              }
           });

           if (!userWalletLink) {
            const linkUserToWallet = await prisma.userWallet.create({
              data: {
                userId,
                walletId: existingWallet.id
              }
            })

            return linkUserToWallet
           }

            // If the link already exists, return a meaningful message or the existing link
            return userWalletLink;
          }

          // Create the wallet first
          const newWallet = await prisma.wallet.create({
            data: {
              address: walletAddress,
            },
          });
  
          // Connect the new wallet to the user via the UserWallet join table
          await prisma.userWallet.create({
            data: {
              userId: userId,
              walletId: newWallet.id,
            },
          });
  
          return newWallet;
      } catch (error: any) {
          console.log('CREATE_WALLET_ERROR', error);
      }
  }

    public async getAll() {
        try {
          const allWallets = await prisma.wallet.findMany({
            select: {
              address: true,
              id: true
            }
          })

          return allWallets
        } catch (error) {
          console.log('GET_ALL_WALLETS_ERROR', error)
        }
    }

    public async getUserWallets(userId: string) {
       try {
        const userWallets = await prisma.userWallet.findMany({
            where: { userId: userId },
            include: {
              wallet: true,
            },
          });
        
         return userWallets
       } catch (error) {
         console.log('GET_ALL_USERS_WALLETS_ERROR', error)
       }
    }

    public async getUserWalletById(userId: string, walletAddress: string) {
      const userWallet = await prisma.userWallet.findFirst({
          where: {
              userId: userId,
              wallet: {
                  address: walletAddress
              }
          },
          select: {
              wallet: {
                  select: {
                      address: true
                  }
              }
          }
      });
  
      // Return the wallet if found, otherwise return null
      return userWallet ? userWallet.wallet : null;
  }

    public async getWalletByAddress(walletAddress: string) {
      const wallet = await prisma.wallet.findFirst({
        where: {
          address: walletAddress
        },
        select: {
          address: true
        }
      })

      return wallet
    }

    public async getAllWalletsWithUserIds() {
      try {
          const walletsWithUsers = await prisma.wallet.findMany({
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
          });
  
          return walletsWithUsers
      } catch (error: any) {
          console.log('GET_ALL_WALLETS_WITH_USER_IDS_ERROR', error);
          throw error;
      }
  }

    public async pulseWallet() {
        const stream = await prisma.userWallet.stream({ create: {}, delete: {} })

          // for await (const event of stream) {
          //   console.log('New event:', event)
          // }

        return stream
    }
}