import TelegramBot from 'node-telegram-bot-api'
import { SubscriptionMessages } from '../messages/subscription-messages'
import { UPGRADE_PLAN_SUB_MENU } from '../../config/bot-menus'
import { PrismaUserRepository } from '../../repositories/prisma/user'

export class UpgradePlanCommand {
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async upgradePlanCommandHandler() {
    this.bot.onText(/\/upgrade/, async (msg) => {
      await this.upgradePlan({ message: msg, isButton: false })
    })
  }

  public async upgradePlanButtonHandler(msg: TelegramBot.Message) {
    await this.upgradePlan({ message: msg, isButton: true })
  }

  public async upgradePlan({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    const userId = message.chat.id.toString()

    const user = await this.prismaUserRepository.getUserPlan(userId)

    const messageText = SubscriptionMessages.upgradeProMessage(user)

    if (isButton) {
      this.bot.editMessageText(messageText, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: UPGRADE_PLAN_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else {
      this.bot.sendMessage(message.chat.id, messageText, {
        reply_markup: UPGRADE_PLAN_SUB_MENU,
        parse_mode: 'HTML',
      })
    }
  }
}
