import TelegramBot from 'node-telegram-bot-api'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { ManageMessages } from '../messages/manage-message'
import { MANAGE_SUB_MENU } from '../../config/bot-menus'

export class ManageCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private manageMessages: ManageMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaWalletRepository = new PrismaWalletRepository()
    this.manageMessages = new ManageMessages()
  }

  public async manageButtonHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

    const messageText = await this.manageMessages.sendManageMessage(userWallets || [])

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: MANAGE_SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
