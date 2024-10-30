import TelegramBot from 'node-telegram-bot-api'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { SUB_MENU } from '../../config/bot-menus'

export class PrivateKeyCommand {
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async showPrivateKeyHandler(msg: TelegramBot.Message) {
    const userId = String(msg.chat.id)

    const userPrivKey = await this.prismaUserRepository.showUserPrivateKey(userId)

    const messageText = `
Your private key (do not share with anyone!!!)

(Click to copy)

<code>${userPrivKey ? userPrivKey : ''}</code>
`

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
