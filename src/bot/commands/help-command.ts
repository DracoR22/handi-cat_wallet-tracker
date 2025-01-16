import TelegramBot from 'node-telegram-bot-api'
import { HelpMessages } from '../messages/help-messages'
import { SUB_MENU } from '../../config/bot-menus'

export class HelpCommand {
  constructor(private bot: TelegramBot) {
    this.bot = bot
  }

  public helpButtonHandler(message: TelegramBot.Message) {
    this.bot.editMessageText(HelpMessages.generalHelp, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      parse_mode: 'HTML',
      reply_markup: SUB_MENU,
    })
  }

  public groupHelpCommandHandler() {
    this.bot.onText(/\/help_group/, async (msg) => {
      this.bot.sendMessage(msg.chat.id, HelpMessages.groupsHelp, {
        parse_mode: 'HTML',
        reply_markup: SUB_MENU,
      })
    })
  }
}
