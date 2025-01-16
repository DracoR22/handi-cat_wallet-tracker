import prisma from '../../providers/prisma'
import { CreateUserGroupInterface } from '../../types/general-interfaces'
import { PrismaUserRepository } from './user'
import { PrismaWalletRepository } from './wallet'

export class PrismaGroupRepository {
  private prismaUserRepository: PrismaUserRepository
  private prismaWalletRepository: PrismaWalletRepository

  constructor() {
    this.prismaUserRepository = new PrismaUserRepository()
    this.prismaWalletRepository = new PrismaWalletRepository()
  }

  public async activateGroup(props: CreateUserGroupInterface) {
    try {
      const newGroup = await prisma.group.create({
        data: {
          ...props,
        },
        select: {
          id: true,
        },
      })

      return newGroup
    } catch (error) {
      console.log('ACTIVATE_GROUP_ERROR', error)
      return
    }
  }

  public async getGroupById(groupId: string, userId: string) {
    try {
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
          userId,
        },
        select: {
          id: true,
        },
      })

      return group
    } catch (error) {
      console.log('GET_GROUP_BY_ID_ERROR')
      return
    }
  }

  public async getAllUserGroupsCount(userId: string) {
    try {
      const allUserGroups = await prisma.group.count({
        where: {
          userId,
        },
      })

      return allUserGroups
    } catch (error) {
      console.log('GET_ALL_USER_GROUPS_COUNT', error)
      return
    }
  }

  public async getAllUserGroups(userId: string) {
    try {
      const allUserGroups = await prisma.group.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          name: true,
        },
      })

      return allUserGroups
    } catch (error) {
      console.log('GET_ALL_USER_GROUPS', error)
      return
    }
  }

  public async getGroupUser(userId: string) {
    try {
      const groupUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      })
      return groupUser
    } catch (error) {
      console.log('GET_GROUP_USER_ERROR')
      return
    }
  }

  public async updateUserGroupStatus(userId: string) {
    try {
      const group = await prisma.group.findFirst({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      })

      if (!group || !group?.id) {
        return
      }

      // const userGroup = await this.prismaUserRepository.getById(group.id)
      await this.prismaUserRepository.updateUserHandiCatStatus(group.id)
    } catch (error) {
      console.log('UPDATE_USER_GROUP_STATUS_ERROR', error)
      return
    }
  }

  public async deleteGroup(groupId: string, userId: string) {
    try {
      const existingGroup = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
        select: {
          id: true,
        },
      })

      if (!existingGroup) {
        return
      }

      const deletedGroup = await prisma.group.delete({
        where: {
          id: groupId,
          userId,
        },
        select: {
          id: true,
        },
      })

      if (!deletedGroup) {
        return
      }

      // for (const wallet of walletsToDelete) {
      //    await this.prismaWalletRepository.deleteWallet(wallet.userId, wallet.address)
      // }

      await prisma.userWallet.deleteMany({
        where: {
          userId: groupId,
        },
      })

      return deletedGroup
    } catch (error) {
      console.log('DELETE_GROUP_ERROR', error)
      return
    }
  }
}
