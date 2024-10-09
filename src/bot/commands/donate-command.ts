import TelegramBot from 'node-telegram-bot-api'
import { DONATE_MENU, SUB_MENU } from '../../config/bot-menus'
import { DonateMessages } from '../messages/donate-messages'

export class DonateCommand {
  private donateMessages: DonateMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.donateMessages = new DonateMessages()
  }

  public donateCommandHandler(msg: TelegramBot.Message) {
    const messageText = this.donateMessages.donateMessage()

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: DONATE_MENU,
      parse_mode: 'HTML',
    })
  }
}
