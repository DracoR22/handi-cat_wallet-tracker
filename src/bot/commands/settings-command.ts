import TelegramBot from 'node-telegram-bot-api'
import { UserSettingsMessages } from '../messages/user-settings-messages'
import { SUB_MENU, USER_SETTINGS_MENU } from '../../config/bot-menus'
import { PrismaUserRepository } from '../../repositories/prisma/user'

export class SettingsCommand {
  private userSettingsMessages: UserSettingsMessages
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.userSettingsMessages = new UserSettingsMessages()
    this.prismaUserRepository = new PrismaUserRepository()
  }

  public async settingsCommandHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    const messageText = UserSettingsMessages.settingsMessage

    const userBotStatus = await this.prismaUserRepository.getBotStatus(userId)

    const sendMessage = this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: USER_SETTINGS_MENU(userBotStatus ? userBotStatus.botStatus : 'ACTIVE'),
      parse_mode: 'HTML',
    })

    return sendMessage
  }
}
