import TelegramBot from 'node-telegram-bot-api'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { ManageMessages } from '../messages/manage-messages'
import { MANAGE_SUB_MENU } from '../../config/bot-menus'
import { UserPlan } from '../../lib/user-plan'

export class ManageCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private userPlan: UserPlan

  private manageMessages: ManageMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()
    this.userPlan = new UserPlan()

    this.manageMessages = new ManageMessages()
  }

  public async manageButtonHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

    const planWallets = await this.userPlan.getUserPlanWallets(userId)

    const messageText = await this.manageMessages.sendManageMessage(userWallets || [], planWallets)

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: MANAGE_SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
