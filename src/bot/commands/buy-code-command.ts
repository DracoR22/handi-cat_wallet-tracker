import TelegramBot from 'node-telegram-bot-api'
import { SUB_MENU } from '../../config/bot-menus'
import { BuyCodeMessage } from '../messages/buy-code-message'

export class BuyCodeCommand {
  private buyCodeMessage: BuyCodeMessage
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.buyCodeMessage = new BuyCodeMessage()
  }

  public buyCodeCommandHandler(msg: TelegramBot.Message) {
    const messageText = this.buyCodeMessage.sendBuyCodeMessage()

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
