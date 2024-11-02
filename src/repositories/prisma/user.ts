import { SubscriptionPlan } from '@prisma/client'
import { CreateWallet } from '../../lib/create-wallet'
import { CreateUserInterface } from '../../types/general-interfaces'
import prisma from '../../providers/prisma'

export class PrismaUserRepository {
  private createWallet: CreateWallet
  constructor() {
    this.createWallet = new CreateWallet()
  }

  public async create({ firstName, id, lastName, username }: CreateUserInterface) {
    const { publicKey, privateKey } = this.createWallet.create()

    const newUser = await prisma.user.create({
      data: {
        firstName,
        id,
        lastName,
        username,
        personalWalletPubKey: publicKey,
        personalWalletPrivKey: privateKey,
      },
    })

    return newUser
  }

  public async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        personalWalletPrivKey: true,
        personalWalletPubKey: true,
        hasDonated: true,
        userSubscription: {
          select: {
            plan: true,
          },
        },
      },
    })

    return user
  }

  public async getUserPlan(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        personalWalletPubKey: true,
        userSubscription: {
          select: {
            plan: true,
          },
        },
      },
    })

    return user
  }

  public async getPersonalWallet(userId: string) {
    const walletBalance = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        personalWalletPubKey: true,
        personalWalletPrivKey: true,
      },
    })

    return walletBalance
  }

  public async hasDonated(userId: string) {
    try {
      const buyCode = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          hasDonated: true,
        },
      })

      return buyCode
    } catch (error) {
      console.log('BUY_SOURCE_CODE_ERROR')
      return
    }
  }

  public async getUsersWithDue() {
    try {
      const today = new Date()

      const usersToCharge = await prisma.userSubscription.findMany({
        where: {
          subscriptionCurrentPeriodEnd: {
            lte: today,
          },
          isCanceled: false,
          plan: {
            not: 'FREE', // only get users which plan is not free
          },
        },
      })

      return usersToCharge
    } catch (error) {
      console.log('GET_USERS_TO_CHARGE_ERROR', error)
      return []
    }
  }

  public async updateUserHandiCatStatus(
    userId: string,
  ): Promise<{ status: string; message: string; changedStatus: 'NONE' | 'ACTIVE' | 'PAUSED' }> {
    try {
      const userWallets = await prisma.userWallet.findMany({
        where: {
          userId,
        },
        select: {
          handiCatStatus: true,
        },
      })

      if (!userWallets) {
        return { status: 'error', message: 'No wallets found for this user', changedStatus: 'NONE' }
      }

      // all wallets will have the same status
      const currentStatus = userWallets[0].handiCatStatus
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'

      await prisma.userWallet.updateMany({
        where: {
          userId,
        },
        data: {
          handiCatStatus: newStatus,
        },
      })

      return {
        status: 'ok',
        message: `All wallets from user ${userId}, updated to status: ${newStatus}`,
        changedStatus: newStatus,
      }
    } catch (error) {
      console.log('UPDATE_HANDICAT_STATUS_ERROR', error)
      return { status: 'error', message: 'An error occurred while updating handi cat status', changedStatus: 'NONE' }
    }
  }

  public async showUserPrivateKey(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          personalWalletPrivKey: true,
        },
      })

      if (!user) {
        console.log('Failed to retrieve user private key')
        return
      }

      const trimmedPrivateKey = user.personalWalletPrivKey.replace(/=*$/, '')

      return trimmedPrivateKey
    } catch (error) {
      console.log('SHOW_PRIVATE_KEY_ERROR')
      return
    }
  }
}
