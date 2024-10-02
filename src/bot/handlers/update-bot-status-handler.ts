import TelegramBot from 'node-telegram-bot-api'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { SUB_MENU } from '../../config/bot-menus'

export class UpdateBotStatusHandler {
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.prismaUserRepository = new PrismaUserRepository()
    this.bot = bot
  }

  public async pauseResumeBot(msg: TelegramBot.Message) {
    const chatId = msg.chat.id

    const botPaused = await this.prismaUserRepository.updateUserHandiCatStatus(String(chatId))

    if (botPaused.status !== 'ok') return

    const messageText = `
Handi Cat has been paused and you will no longer receive more notifications until you resume it!

you can still resume the bot anytime at the settings menu
`

    this.bot.editMessageText(messageText, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
