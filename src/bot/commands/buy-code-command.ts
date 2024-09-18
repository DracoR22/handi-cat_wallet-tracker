import TelegramBot from 'node-telegram-bot-api'
import { BUY_SOURCE_CODE_MENU } from '../../config/bot-menus'
import { BuyCodeMessage } from '../messages/buy-code-messages'

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
      reply_markup: BUY_SOURCE_CODE_MENU,
      parse_mode: 'HTML',
    })
  }
}
