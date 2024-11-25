import TelegramBot from 'node-telegram-bot-api'
import { START_MENU } from '../../config/bot-menus'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { GeneralMessages } from '../messages/general-messages'

export class StartCommand {
  private prismaUserRepository: PrismaUserRepository

  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public start() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      const firstName = msg.from?.first_name || ''
      const lastName = msg.from?.last_name || ''
      const username = msg.from?.username || ''
      const userId = msg.chat.id.toString()

      if (!userId) {
        return
      }

      // Find existing user
      const user = await this.prismaUserRepository.getById(userId)

      const messageText = GeneralMessages.startMessage(user)

      this.bot.sendMessage(chatId, messageText, { reply_markup: START_MENU, parse_mode: 'HTML' })

      // Create new user
      if (!user) {
        await this.prismaUserRepository.create({ firstName, id: userId, lastName, username })
      }
    })
  }
}
