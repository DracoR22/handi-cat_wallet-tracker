import TelegramBot from 'node-telegram-bot-api'
import { DONATE_MENU, SUB_MENU } from '../../config/bot-menus'
import { DonateMessages } from '../messages/donate-messages'
import { PrismaUserRepository } from '../../repositories/prisma/user'

export class DonateCommand {
  private donateMessages: DonateMessages
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.donateMessages = new DonateMessages()
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async donateCommandHandler(msg: TelegramBot.Message) {
    const user = await this.prismaUserRepository.getUserPlan(String(msg.chat.id))

    const userWallet = user?.personalWalletPubKey

    const messageText = this.donateMessages.donateMessage(userWallet)

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: DONATE_MENU,
      parse_mode: 'HTML',
    })
  }
}
