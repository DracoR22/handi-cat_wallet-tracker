import prisma from "./prisma";

export class PrismaWalletRepository {
    constructor() {}

    public async create(userId: string, walletAddress: string) {
        try {
            const newWallet = await prisma.wallet.create({
              data: {
                userId,
                address: walletAddress,
                userWallets: {
                  create: {
                    user: {
                      connect: { id: userId },
                    },
                  },
                },
              },
            });

            return newWallet;
          } catch (error: any) {
            console.log('CREATE_WALLET_ERROR', error)
          }
    }

    public async getAll() {
        try {
          const allWallets = await prisma.wallet.findMany({
            select: {
              address: true
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

    public async getWalletByAddress(userId: string, walletAddress: string) {
      const wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          address: walletAddress
        },
        select: {
          address: true
        }
      })

      return wallet
    }

    public async pulseWallet() {
        const stream = await prisma.wallet.stream({ name: 'wallet-stream', create: {} })

          // for await (const event of stream) {
          //   console.log('New event:', event)
          // }

        return stream
    }
}