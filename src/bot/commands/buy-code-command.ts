import TelegramBot from 'node-telegram-bot-api'
import { SUB_MENU } from '../../config/bot-menus'

export class BuyCodeCommand {
  constructor(private bot: TelegramBot) {
    this.bot = bot
  }

  public buyCodeCommandHandler(msg: TelegramBot.Message) {
    this.bot.editMessageText('Buy Handi Cat code', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
