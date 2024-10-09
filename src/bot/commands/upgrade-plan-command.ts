import TelegramBot from 'node-telegram-bot-api'
import { SubscriptionMessages } from '../messages/subscription-messages'
import { UPGRADE_PLAN_SUB_MENU } from '../../config/bot-menus'
import { PrismaUserRepository } from '../../repositories/prisma/user'

export class UpgradePlanCommand {
  private subscriptionMessages: SubscriptionMessages
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.subscriptionMessages = new SubscriptionMessages()
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async upgradePlanCommandHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    const user = await this.prismaUserRepository.getUserPlan(userId)

    const messageText = this.subscriptionMessages.sendUpgradeProMessage(user)

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: UPGRADE_PLAN_SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
