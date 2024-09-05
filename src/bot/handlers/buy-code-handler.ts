import TelegramBot from 'node-telegram-bot-api'
import { Payments } from '../../lib/payments'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { GeneralMessages } from '../messages/general-messages'
import { SUB_MENU } from '../../config/bot-menus'

export class BuyCodeHandler {
  private payments: Payments
  private generalMessages: GeneralMessages
  constructor(private bot: TelegramBot) {
    this.payments = new Payments()
    this.generalMessages = new GeneralMessages()

    this.bot = bot
  }

  public async buySourceCode(message: TelegramBot.Message) {
    const userId = String(message.chat.id)
    const chatId = message.chat.id

    const { message: paymentMessage, success } = await this.payments.chargeSourceCode(userId)

    if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(this.generalMessages.sendInsufficientBalanceMessage(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.SOURCE_CODE_BOUGHT) {
      this.bot.editMessageText(this.generalMessages.sendSourceCodeBoughtMessage(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.USER_ALREADY_PAID) {
      this.bot.editMessageText(this.generalMessages.sendUserAlreadyPaidMessage('CODE'), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else {
      this.bot.editMessageText(this.generalMessages.sendGeneralMessageError(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    }

    return
  }
}
