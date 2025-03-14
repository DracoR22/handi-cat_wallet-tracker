import TelegramBot from 'node-telegram-bot-api'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { bot } from '../providers/telegram'
import { SubscriptionMessages } from '../bot/messages/subscription-messages'
import { PrismaGroupRepository } from '../repositories/prisma/group'
import { GeneralMessages } from '../bot/messages/general-messages'
import dotenv from 'dotenv'

dotenv.config()

export class BotMiddleware {
  static isGroup(chatId: number): boolean {
    return chatId < 0
  }

  static async isUserPro(userId: string): Promise<boolean> {
    const prismaUserRepository = new PrismaUserRepository()

    const userPlan = await prismaUserRepository.getUserPlan(userId)

    const isAuthorized = userPlan?.userSubscription?.plan === 'PRO' || userPlan?.userSubscription?.plan === 'WHALE'

    return isAuthorized || false
  }

  static isUserBotAdmin(userId: string): boolean {
    try {
      // Get the list of administrators for the group chat
      const adminId = process.env.ADMIN_CHAT_ID ?? ''

      const isAdmin = userId === adminId

      return isAdmin
    } catch (error) {
      console.error('Error checking if user is admin:', error)
      return false
    }
  }

  static async isUserGroupAdmin(chatId: number, userId: string): Promise<boolean> {
    try {
      // Get the list of administrators for the group chat
      const admins = await bot.getChatAdministrators(chatId)

      const isAdmin = admins.some((admin) => admin.user.id.toString() === userId)

      return isAdmin
    } catch (error) {
      console.error('Error checking if user is admin:', error)
      return false
    }
  }

  static async checkGroupActivated(
    chatId: number,
    userId: string,
  ): Promise<{ isValid: boolean; reason: 'BOT_NOT_STARTED' | 'BOT_NOT_ACTIVATED' | 'USER_NOT_AUTHORIZED' | 'VALID' }> {
    const prismaGroupRepository = new PrismaGroupRepository()

    const [existingGroup, groupUser] = await Promise.all([
      prismaGroupRepository.getGroupById(String(chatId), userId),
      prismaGroupRepository.getGroupUser(String(chatId)),
    ])

    if (!groupUser) {
      return {
        isValid: false,
        reason: 'BOT_NOT_STARTED',
      }
    }

    if (!existingGroup) {
      return {
        isValid: false,
        reason: 'BOT_NOT_ACTIVATED',
      }
    }

    if (String(chatId) !== existingGroup.id) {
      return { isValid: false, reason: 'USER_NOT_AUTHORIZED' }
    }

    return { isValid: true, reason: 'VALID' }
  }

  static async checkGroupChatRequirements(
    chatId: number,
    userId: string,
  ): Promise<{ isValid: boolean; message: string }> {
    if (!BotMiddleware.isGroup(chatId)) {
      return { isValid: true, message: '' }
    }

    const checkGroupActivated = await BotMiddleware.checkGroupActivated(chatId, userId)

    if (!checkGroupActivated.isValid && checkGroupActivated.reason === 'BOT_NOT_STARTED') {
      return {
        isValid: false,
        message: GeneralMessages.groupChatNotStarted,
      }
    }

    if (!checkGroupActivated.isValid && checkGroupActivated.reason === 'BOT_NOT_ACTIVATED') {
      return {
        isValid: false,
        message: GeneralMessages.groupChatNotActivated,
      }
    }

    if (!checkGroupActivated.isValid && checkGroupActivated.reason === 'USER_NOT_AUTHORIZED') {
      return {
        isValid: false,
        message: GeneralMessages.userNotAuthorizedInGroup,
      }
    }

    const isUserPro = await BotMiddleware.isUserPro(userId)
    if (!isUserPro) {
      return {
        isValid: false,
        message: SubscriptionMessages.groupChatNotPro,
      }
    }

    return { isValid: true, message: '' }
  }
}
