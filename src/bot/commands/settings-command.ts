import TelegramBot from 'node-telegram-bot-api'
import { UserSettingsMessages } from '../messages/user-settings-messages'
import { SUB_MENU, USER_SETTINGS_MENU } from '../../config/bot-menus'

export class SettingsCommand {
  private userSettingsMessages: UserSettingsMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.userSettingsMessages = new UserSettingsMessages()
  }

  public async settingsCommandHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()

    const messageText = UserSettingsMessages.settingsMessage

    const sendMessage = this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: USER_SETTINGS_MENU,
      parse_mode: 'HTML',
    })

    return sendMessage
  }
}
