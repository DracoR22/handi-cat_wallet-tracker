import { SubscriptionPlan } from '@prisma/client'
import { CreateWallet } from '../../lib/create-wallet'
import { CreateUserGroupInterface, CreateUserInterface } from '../../types/general-interfaces'
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
            subscriptionCurrentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            userWallets: true,
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
            subscriptionCurrentPeriodEnd: true,
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
      today.setHours(23, 59, 59, 999)

      const usersToCharge = await prisma.userSubscription.findMany({
        where: {
          subscriptionCurrentPeriodEnd: {
            lte: today,
          },
          isCanceled: false,
          plan: {
            not: 'FREE',
          },
        },
      })

      return usersToCharge
    } catch (error) {
      console.log('GET_USERS_TO_CHARGE_ERROR', error)
      return []
    }
  }

  public async getUsersWithEndingTomorrow() {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0) // Reset time to start of day

      const usersToRenew = await prisma.userSubscription.findMany({
        where: {
          subscriptionCurrentPeriodEnd: {
            equals: tomorrow,
          },
          isCanceled: false,
          plan: {
            not: 'FREE',
          },
        },
        select: {
          plan: true,
          id: true,
          userId: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      })

      return usersToRenew
    } catch (error) {
      console.log('GET_USERS_WITH_ENDING_TOMORROW_ERROR', error)
      return []
    }
  }

  public async updateUserHandiCatStatus(
    userId: string,
  ): Promise<{ status: string; message: string; changedStatus: 'NONE' | 'ACTIVE' | 'PAUSED' }> {
    try {
      const currentStatus = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          botStatus: true,
        },
      })

      const newStatus = currentStatus?.botStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'

      const updatedStatus = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          botStatus: newStatus,
        },
      })

      return { status: 'ok', message: 'status updated', changedStatus: newStatus }
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

  public async getFreeUsers() {
    try {
      const freeUsers = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [{ userSubscription: null }, { userSubscription: { plan: 'FREE' } }],
            },
            { userPromotions: { none: {} } },
          ],
        },
      })

      return freeUsers
    } catch (error) {
      console.log('GET_FREE_USERS_ERROR')
      return
    }
  }

  public async getPausedUsers(userIds: string[]) {
    try {
      const pausedUsers = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
          NOT: {
            botStatus: 'ACTIVE',
          },
        },
        select: {
          id: true,
        },
      })

      return pausedUsers.map((user) => user.id)
    } catch (error) {
      console.log('GET_PAUSED_USERS_ERROR')
      return
    }
  }

  public async getBotStatus(userId: string) {
    try {
      const botStatus = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          botStatus: true,
        },
      })

      return botStatus
    } catch (error) {
      console.log('GET_PAUSED_USERS_ERROR')
      return
    }
  }
}
