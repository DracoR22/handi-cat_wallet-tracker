import { WalletStatus } from '@prisma/client'
import prisma from '../../providers/prisma'
import { WalletWithUsers } from '../../types/swap-types'

export class PrismaWalletRepository {
  constructor() {}

  public async create(userId: string, walletAddress: string, walletName?: string) {
    try {
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          address: walletAddress,
        },
        select: {
          id: true,
        },
      })

      if (existingWallet) {
        // Check if the user is already linked to this wallet
        const userWalletLink = await prisma.userWallet.findFirst({
          where: {
            userId,
            walletId: existingWallet.id,
          },
          select: {
            userId: true,
          },
        })

        if (!userWalletLink) {
          const linkUserToWallet = await prisma.userWallet.create({
            data: {
              userId,
              walletId: existingWallet.id,
              name: walletName ? walletName : '',
              address: walletAddress,
            },
          })

          return existingWallet
        }

        return existingWallet
      }

      // Create the wallet first
      const newWallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
        },
        select: {
          id: true,
        },
      })

      // Connect the new wallet to the user via the UserWallet join table
      await prisma.userWallet.create({
        data: {
          userId: userId,
          walletId: newWallet.id,
          name: walletName ? walletName : '',
          address: walletAddress,
        },
      })

      return newWallet
    } catch (error: any) {
      console.log('CREATE_WALLET_ERROR', error)
    }
  }

  public async deleteWallet(userId: string, walletAddress: string) {
    if (!walletAddress) {
      console.log('NO WALLET ADDRESS PROVIDED')
      return
    }
    try {
      const wallet = await prisma.wallet.findFirst({
        where: {
          address: walletAddress,
          userWallets: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
        },
      })

      if (!wallet) {
        console.log('WALLET NOT FOUND')
        return
      }

      const deletedWallet = await prisma.userWallet.delete({
        where: {
          userId_walletId: {
            userId: userId,
            walletId: wallet.id,
          },
        },
        select: {
          walletId: true,
        },
      })

      if (!deletedWallet) {
        return
      }

      return deletedWallet
    } catch (error) {
      console.log('DELETE_WALLET_ERROR', error)
    }
  }

  public async getAll() {
    try {
      const allWallets = await prisma.wallet.findMany({
        select: {
          address: true,
          id: true,
        },
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
        select: {
          wallet: true,
          userId: true,
          walletId: true,
          name: true,
          status: true,
        },
      })

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
          address: walletAddress,
        },
      },
      select: {
        wallet: {
          select: {
            address: true,
          },
        },
      },
    })

    return userWallet ? userWallet.wallet : null
  }

  public async getWalletByAddress(walletAddress: string) {
    const wallet = await prisma.wallet.findFirst({
      where: {
        address: walletAddress,
      },
      select: {
        address: true,
        id: true,
      },
    })

    return wallet
  }

  public async getAllWalletsWithUserIds() {
    try {
      const walletsWithUsers = await prisma.wallet.findMany({
        where: {
          userWallets: {
            some: {
              status: {
                not: 'BANNED',
              },
              handiCatStatus: {
                not: 'PAUSED',
              },
            },
          },
        },
        include: {
          userWallets: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      return walletsWithUsers
    } catch (error: any) {
      console.log('GET_ALL_WALLETS_WITH_USER_IDS_ERROR', error)
      return
    }
  }

  public async getUserWalletsWithUserIds(userId: string) {
    try {
      const walletsWithUsers = await prisma.wallet.findMany({
        where: {
          userWallets: {
            some: {
              userId,
              status: {
                not: 'BANNED',
              },
              handiCatStatus: {
                not: 'PAUSED',
              },
            },
          },
        },
        include: {
          userWallets: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      return walletsWithUsers
    } catch (error: any) {
      console.log('GET_ALL_WALLETS_WITH_USER_IDS_ERROR', error)
      return
    }
  }

  public async getBannedUserWalletsWithUserIds(userId: string) {
    try {
      const walletsWithUsers = await prisma.wallet.findMany({
        where: {
          userWallets: {
            some: {
              userId,
              OR: [{ status: 'BANNED' }, { status: 'SPAM_PAUSED' }, { handiCatStatus: 'PAUSED' }],
            },
          },
        },
        include: {
          userWallets: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      return walletsWithUsers
    } catch (error: any) {
      console.log('GET_ALL_WALLETS_WITH_USER_IDS_ERROR', error)
      return
    }
  }

  public async getWalletByIdForArray(walletId: string): Promise<WalletWithUsers | null> {
    try {
      const walletWithUsers = await prisma.wallet.findUnique({
        where: { id: walletId },
        include: {
          userWallets: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      return walletWithUsers
    } catch (error: any) {
      console.log('GET_WALLET_BY_ID_ERROR', error)
      return null
    }
  }

  public async getUserWalletNameById(userId: string, walletAddress: string) {
    const userWallet = await prisma.userWallet.findFirst({
      where: {
        userId: userId,
        wallet: {
          address: walletAddress,
        },
      },
      select: {
        name: true,
        address: true,
      },
    })

    return userWallet
  }

  public async getWalletById(walletId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: {
          id: walletId,
        },
        select: {
          address: true,
          userWallets: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!wallet) {
        console.log(`No wallet found with ID: ${walletId}`)
        return null
      }

      return wallet
    } catch (error) {
      console.error(`Error fetching wallet with ID ${walletId}:`, error)
      return null
    }
  }

  public async pauseUserWalletSpam(walletId: string, status: WalletStatus) {
    try {
      const pausedWallet = await prisma.userWallet.updateMany({
        where: {
          // userId_walletId: {
          //   userId,
          //   walletId,
          // },
          walletId,
        },
        data: {
          status,
        },
      })

      if (!pausedWallet) {
        return
      }

      return pausedWallet
    } catch (error) {
      console.log('Error pausing user wallet')
      return
    }
  }

  public async resumeUserWallet(userId: string, walletId: string) {
    try {
      const walletToResume = await prisma.userWallet.findUnique({
        where: {
          userId_walletId: {
            userId,
            walletId,
          },
        },
        select: {
          status: true,
        },
      })

      if (walletToResume?.status === 'BANNED') {
        return false
      }
      const resumedWallet = await prisma.userWallet.update({
        where: {
          userId_walletId: {
            userId,
            walletId,
          },
        },
        data: {
          status: 'ACTIVE',
        },
      })

      return true
    } catch (error) {
      console.log('Error resuming wallet')
      return
    }
  }
}
